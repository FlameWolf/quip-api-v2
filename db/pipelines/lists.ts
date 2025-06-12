"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";

const includesMember = (memberId?: string | ObjectId): Array<PipelineStage> => {
	if (!memberId) {
		return [];
	}
	return [
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
	];
};
const listsAggregationPipeline = (userId: string | ObjectId, memberId?: string | ObjectId, lastListId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			owner: new ObjectId(userId)
		}
	},
	...includesMember(memberId),
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
					$expr: {
						$eq: true
					}
				}
	},
	{
		$limit: maxRowsPerFetch
	}
];

export default listsAggregationPipeline;