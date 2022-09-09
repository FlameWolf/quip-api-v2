"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import postAggregationPipeline from "./post";

const mentionsAggregationPipeline = (userId: string | ObjectId, selfId?: string | ObjectId, lastPostId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			mentions: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	...(selfId
		? [
				{
					$lookup: {
						from: "blocks",
						pipeline: [
							{
								$match: {
									$expr: {
										$eq: ["$blockedBy", new ObjectId(selfId)]
									}
								}
							},
							{
								$group: {
									_id: undefined,
									result: {
										$addToSet: "$user"
									}
								}
							}
						],
						as: "blockedUsers"
					}
				},
				{
					$addFields: {
						blockedUsers: {
							$ifNull: [
								{
									$arrayElemAt: ["$blockedUsers.result", 0]
								},
								[]
							]
						}
					}
				},
				{
					$match: {
						$expr: {
							$not: {
								$in: ["$author", "$blockedUsers"]
							}
						}
					}
				},
				{
					$unset: "blockedUsers"
				}
		  ]
		: []),
	{
		$match: lastPostId
			? {
					_id: {
						$lt: new ObjectId(lastPostId)
					}
			  }
			: {
					$expr: true
			  }
	},
	{
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

export default mentionsAggregationPipeline;