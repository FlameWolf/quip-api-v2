"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const getPageConditions = (lastPostId: undefined, sortByDate: boolean, lastScore: any) => {
	if (lastPostId) {
		const lastPostObjectId = new ObjectId(lastPostId);
		if (sortByDate) {
			return {
				lastPostId: {
					$lt: lastPostObjectId
				}
			};
		} else if (lastScore) {
			const parsedLastScore = parseInt(lastScore);
			return {
				$expr: {
					$or: [
						{
							$and: [
								{
									$eq: ["$score", parsedLastScore]
								},
								{
									$lt: ["$_id", lastPostObjectId]
								}
							]
						},
						{
							$lt: ["$score", parsedLastScore]
						}
					]
				}
			};
		}
	}
};
const hashtagAggregationPipeline = (hashtag: string, userId: any = undefined, sortBy: string = "date", lastScore: any = undefined, lastPostId: any = undefined): Array<any> => {
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
			$match: getPageConditions(lastPostId, sortByDate, lastScore)
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

export default hashtagAggregationPipeline;