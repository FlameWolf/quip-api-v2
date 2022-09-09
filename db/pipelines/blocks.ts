"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const blocksAggregationPipeline = (userId: string | ObjectId, lastBlockId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			blockedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastBlockId
			? {
					_id: {
						$lt: new ObjectId(lastBlockId)
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
			user: 1,
			reason: 1
		}
	}
];

export default blocksAggregationPipeline;