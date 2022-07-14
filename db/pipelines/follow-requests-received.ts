"use strict";

import { ObjectId } from "bson";

const followRequestsReceivedAggregationPipeline = (userId: any, lastFollowRequestId: any = undefined): Array<any> => [
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
		$limit: 20
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