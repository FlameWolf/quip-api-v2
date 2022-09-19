"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxCacheSize, maxRowsPerFetch } from "../../library";
import filterRepeatsAggregationPipeline from "./filter-repeats";
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
				from: "posts",
				let: {
					userId: "$_id",
					following: "$follows"
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
						$limit: maxCacheSize
					},
					...filterRepeatsAggregationPipeline(includeRepeats),
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
						$limit: maxRowsPerFetch
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