"use strict";

import { ObjectId } from "bson";
import { FilterQuery, PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import postAggregationPipeline from "./post";

const getPageConditions = (sortByDate: boolean, lastScore?: number, lastPostId?: string | ObjectId): FilterQuery<any> | undefined => {
	if (lastPostId) {
		const lastPostObjectId = new ObjectId(lastPostId);
		if (sortByDate) {
			return {
				lastPostId: {
					$lt: lastPostObjectId
				}
			};
		}
		if (lastScore) {
			return {
				$expr: {
					$or: [
						{
							$and: [
								{
									$eq: ["$score", lastScore]
								},
								{
									$lt: ["$_id", lastPostObjectId]
								}
							]
						},
						{
							$lt: ["$score", lastScore]
						}
					]
				}
			};
		}
	}
	return {};
};
const hashtagAggregationPipeline = (hashtag: string, userId?: string | ObjectId, sortBy: string = "date", lastScore?: number, lastPostId?: string | ObjectId): Array<PipelineStage> => {
	const sortByDate = sortBy !== "popular";
	return [
		{
			$match: {
				hashtags: hashtag
			}
		},
		{
			$sort: sortByDate
				? {
						createdAt: -1,
						score: -1
				  }
				: {
						score: -1,
						createdAt: -1
				  }
		},
		{
			$match: getPageConditions(sortByDate, lastScore, lastPostId) as FilterQuery<any>
		},
		{
			$limit: maxRowsPerFetch
		},
		...postAggregationPipeline(userId)
	];
};

export default hashtagAggregationPipeline;