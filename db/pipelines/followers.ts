"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const followersAggregationPipeline = (userId: string | ObjectId, lastFollowId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			user: new ObjectId(userId)
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
			localField: "followedBy",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "followedBy"
		}
	},
	{
		$unwind: "$followedBy"
	},
	{
		$project: {
			followedBy: 1
		}
	}
];

export default followersAggregationPipeline;