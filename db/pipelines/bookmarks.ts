"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const bookmarksAggregationPipeline = (userId: any, lastBookmarkId: any = undefined): Array<any> => [
	{
		$match: {
			_id: new ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "bookmarks",
			localField: "_id",
			foreignField: "bookmarkedBy",
			let: {
				userId: "$_id"
			},
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastBookmarkId
						? {
								_id: {
									$lt: new ObjectId(lastBookmarkId)
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
			as: "bookmarks"
		}
	},
	{
		$unwind: "$bookmarks"
	},
	{
		$replaceWith: "$bookmarks"
	}
];

export default bookmarksAggregationPipeline;