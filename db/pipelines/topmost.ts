"use strict";

import { ObjectId } from "bson";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const topmostAggregationPipeline = (userId?: string | ObjectId, period: string = "", lastScore?: number, lastPostId?: string | ObjectId) => {
	const matchConditions: Dictionary = {};
	const pageConditions: Dictionary = {};
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
			$limit: 10000
		},
		...filtersAggregationPipeline(userId),
		{
			$match: pageConditions
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

export default topmostAggregationPipeline;