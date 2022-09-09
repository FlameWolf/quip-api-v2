"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const followingAggregationPipeline = (userId: string | ObjectId, lastFollowId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			followedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastFollowId
			? {
					_id: {
						$lt: new ObjectId(lastFollowId)
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
			localField: "user",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "user"
		}
	},
	{
		$unwind: "$user"
	},
	{
		$project: {
			user: 1
		}
	}
];

export default followingAggregationPipeline;