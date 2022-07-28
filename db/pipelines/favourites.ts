"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const favouritesAggregationPipeline = (userId: string | ObjectId, lastFavouriteId?: string | ObjectId): Array<any> => [
	{
		$match: {
			_id: new ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "favourites",
			localField: "_id",
			foreignField: "favouritedBy",
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastFavouriteId
						? {
								_id: {
									$lt: new ObjectId(lastFavouriteId)
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
						from: "posts",
						localField: "post",
						foreignField: "_id",
						pipeline: postAggregationPipeline(userId),
						as: "post"
					}
				},
				{
					$unwind: "$post"
				},
				{
					$project: {
						post: 1
					}
				}
			],
			as: "favourites"
		}
	},
	{
		$unwind: "$favourites"
	},
	{
		$replaceWith: "$favourites"
	}
];

export default favouritesAggregationPipeline;