"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const getPageConditions = (sortByDate: boolean, lastScore?: number, lastPostId?: string | ObjectId) => {
	if (lastPostId) {
		const lastPostObjectId = new ObjectId(lastPostId);
		if (sortByDate) {
			return {
				lastPostId: {
					$lt: lastPostObjectId
				}
			};
		} else if (lastScore) {
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
};
const hashtagAggregationPipeline = (hashtag: string, userId?: string | ObjectId, sortBy: string = "date", lastScore?: number, lastPostId?: string | ObjectId): Array<any> => {
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
			$match: getPageConditions(sortByDate, lastScore, lastPostId)
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

export default hashtagAggregationPipeline;