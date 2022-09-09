"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const timelineAggregationPipeline = (userId: string | ObjectId, includeRepeats: boolean = true, includeReplies: boolean = true, lastPostId?: string | ObjectId): Array<PipelineStage> => {
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
				from: "follows",
				localField: "_id",
				foreignField: "followedBy",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "user",
							foreignField: "_id",
							pipeline: [
								{
									$match: {
										deactivated: false,
										deleted: false
									}
								}
							],
							as: "activeUser"
						}
					},
					{
						$unwind: "$activeUser"
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$user"
							}
						}
					}
				],
				as: "following"
			}
		},
		{
			$lookup: {
				from: "posts",
				let: {
					userId: "$_id",
					following: {
						$ifNull: [
							{
								$arrayElemAt: ["$following.result", 0]
							},
							[]
						]
					}
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$or: [
									{
										$in: ["$author", "$$following"]
									},
									{
										$eq: ["$author", "$$userId"]
									}
								]
							}
						}
					},
					{
						$match: Object.keys(matchConditions).length ? matchConditions : { $expr: true }
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					{
						$limit: 10000
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
													repeatedBy: "$$repeatedBy"
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
								},
								{
									$replaceRoot: {
										newRoot: {
											$ifNull: ["$repeatedPost", "$$ROOT"]
										}
									}
								}
						  ]
						: []),
					...(filtersAggregationPipeline(userId) as Array<any>),
					{
						$match: lastPostId
							? {
									_id: {
										$lt: new ObjectId(lastPostId)
									}
							  }
							: {
									$expr: true
							  }
					},
					{
						$limit: 20
					},
					{
						$lookup: {
							from: "users",
							localField: "repeatedBy",
							foreignField: "_id",
							pipeline: [
								{
									$project: {
										handle: 1
									}
								}
							],
							as: "repeatedBy"
						}
					},
					{
						$unwind: {
							path: "$repeatedBy",
							preserveNullAndEmptyArrays: true
						}
					},
					...postAggregationPipeline(userId)
				],
				as: "posts"
			}
		},
		{
			$project: {
				_id: 0,
				posts: 1
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

export default timelineAggregationPipeline;