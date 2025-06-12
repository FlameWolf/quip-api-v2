"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import postAggregationPipeline from "./post";

const filterBlocked = (selfId?: string | ObjectId) => {
	if (!selfId) {
		return [];
	}
	return [
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
	];
};
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
	...filterBlocked(selfId),
	{
		$match: lastPostId
			? {
					_id: {
						$lt: new ObjectId(lastPostId)
					}
				}
			: {
					$expr: {
						$eq: true
					}
				}
	},
	{
		$limit: maxRowsPerFetch
	},
	...postAggregationPipeline(userId)
];

export default mentionsAggregationPipeline;