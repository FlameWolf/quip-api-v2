"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const userPostsAggregationPipeline = (userId: string | ObjectId, includeRepeats: boolean = false, includeReplies: boolean = false, lastPostId?: string | ObjectId): Array<any> => {
	const matchConditions = {
		...(!includeRepeats && {
			repeatPost: {
				$eq: null
			}
		}),
		...(!includeReplies && {
			replyTo: {
				$eq: null
			}
		}),
		...(lastPostId && {
			_id: {
				$lt: new ObjectId(lastPostId)
			}
		})
	};
	return [
		{
			$match: {
				_id: new ObjectId(userId)
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "author",
				pipeline: [
					{
						$match: Object.keys(matchConditions).length ? matchConditions : { $expr: true }
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					...(includeRepeats
						? [
								{
									$lookup: {
										from: "posts",
										localField: "repeatPost",
										foreignField: "_id",
										let: {
											repeatedBy: "$author"
										},
										pipeline: [
											{
												$addFields: {
													repeatedBy: "$$repeatedBy",
													repeated: true
												}
											}
										],
										as: "repeatedPost"
									}
								},
								{
									$unwind: {
										path: "$repeatedPost",
										preserveNullAndEmptyArrays: true
									}
								}
						  ]
						: []),
					{
						$replaceWith: {
							$ifNull: ["$repeatedPost", "$$ROOT"]
						}
					},
					{
						$limit: 20
					},
					...postAggregationPipeline(userId)
				],
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceWith: "$posts"
		}
	];
};

export default userPostsAggregationPipeline;