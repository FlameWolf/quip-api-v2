"use strict";

import { ObjectId } from "bson";

const listsAggregationPipeline = (userId: any, memberId: any = undefined, lastListId: any = undefined): Array<any> => [
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