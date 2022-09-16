"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";

const followRequestsReceivedAggregationPipeline = (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId): Array<PipelineStage> => [
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
		$limit: maxRowsPerFetch
	},
	{
		$lookup: {
			from: "users",
			localField: "requestedBy",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "requestedBy"
		}
	},
	{
		$unwind: "$requestedBy"
	},
	{
		$project: {
			requestedBy: 1
		}
	}
];

export default followRequestsReceivedAggregationPipeline;