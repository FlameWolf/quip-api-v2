"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import filterRepeatsAggregationPipeline from "./filter-repeats";
import postAggregationPipeline from "./post";

const userPostsAggregationPipeline = (userId: string | ObjectId, includeRepeats: boolean = false, includeReplies: boolean = false, visitorId?: string | ObjectId, lastPostId?: string | ObjectId): Array<PipelineStage> => {
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
					...filterRepeatsAggregationPipeline(includeRepeats),
					{
						$replaceRoot: {
							newRoot: {
								$ifNull: ["$repeatedPost", "$$ROOT"]
							}
						}
					},
					{
						$limit: maxRowsPerFetch
					},
					...(postAggregationPipeline(visitorId) as Array<any>)
				],
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceRoot: {
				newRoot: "$posts"
			}
		}
	];
};

export default userPostsAggregationPipeline;