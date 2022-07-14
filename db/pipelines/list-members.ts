"use strict";

import { ObjectId } from "bson";

const listMembersAggregationPipeline = (listId: any, lastMemberId: any = undefined): Array<any> => [
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

export default listMembersAggregationPipeline;