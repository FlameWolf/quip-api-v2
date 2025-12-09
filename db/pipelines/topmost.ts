"use strict";

import { ObjectId } from "mongodb";
import { PipelineStage } from "mongoose";
import { Filter } from "mongodb";
import { maxCacheSize, maxRowsPerFetch } from "../../library";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const topmostAggregationPipeline = (userId?: string | ObjectId, period: string = "", lastScore?: number, lastPostId?: string | ObjectId): Array<PipelineStage> => {
	const matchConditions: Filter<any> = {};
	const pageConditions: Filter<any> = {};
	if (period !== "all") {
		const maxDate = new Date();
		switch (period.toLowerCase()) {
			case "year":
				maxDate.setFullYear(maxDate.getFullYear() - 1);
				break;
			case "month":
				maxDate.setMonth(maxDate.getMonth() - 1);
				break;
			case "week":
				maxDate.setDate(maxDate.getDate() - 7);
				break;
			case "day":
			default:
				maxDate.setDate(maxDate.getDate() - 1);
				break;
		}
		matchConditions.createdAt = { $gte: maxDate };
	}
	if (lastScore && lastPostId) {
		pageConditions.$expr = {
			$or: [
				{
					$and: [
						{
							$eq: ["$score", lastScore]
						},
						{
							$lt: ["$_id", new ObjectId(lastPostId)]
						}
					]
				},
				{
					$lt: ["$score", lastScore]
				}
			]
		};
	}
	return [
		{
			$match: matchConditions
		},
		{
			$sort: {
				score: -1,
				createdAt: -1
			}
		},
		{
			$limit: maxCacheSize
		},
		...filtersAggregationPipeline(userId),
		{
			$match: pageConditions
		},
		{
			$limit: maxRowsPerFetch
		},
		...postAggregationPipeline(userId)
	];
};

export default topmostAggregationPipeline;