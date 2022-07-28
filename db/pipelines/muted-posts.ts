"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const mutedPostsAggregationPipeline = (userId: string | ObjectId, lastMuteId?: string | ObjectId): Array<any> => [
	{
		$match: {
			mutedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMuteId
			? {
					_id: {
						$lt: new ObjectId(lastMuteId)
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
];

export default mutedPostsAggregationPipeline;