"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const listsAggregationPipeline = (userId: string | ObjectId, memberId?: string | ObjectId, lastListId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			owner: new ObjectId(userId)
		}
	},
	...(memberId
		? [
				{
					$lookup: {
						from: "listmembers",
						localField: "_id",
						foreignField: "list",
						pipeline: [
							{
								$match: {
									user: new ObjectId(memberId)
								}
							},
							{
								$addFields: {
									result: true
								}
							}
						],
						as: "includes"
					}
				},
				{
					$addFields: {
						includes: {
							$arrayElemAt: ["$includes.result", 0]
						}
					}
				}
		  ]
		: []),
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastListId
			? {
					_id: {
						$lt: new ObjectId(lastListId)
					}
			  }
			: {
					$expr: true
			  }
	},
	{
		$limit: 20
	}
];

export default listsAggregationPipeline;