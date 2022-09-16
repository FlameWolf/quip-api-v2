"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";

const listMembersAggregationPipeline = (listId: string | ObjectId, lastMemberId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			list: new ObjectId(listId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMemberId
			? {
					_id: {
						$lt: new ObjectId(lastMemberId)
					}
			  }
			: {
					$expr: true
			  }
	},
	{
		$limit: maxRowsPerFetch
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

export default listMembersAggregationPipeline;