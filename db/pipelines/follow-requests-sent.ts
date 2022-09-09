"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const followRequestsSentAggregationPipeline = (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			requestedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastFollowRequestId
			? {
					_id: {
						$lt: new ObjectId(lastFollowRequestId)
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

export default followRequestsSentAggregationPipeline;