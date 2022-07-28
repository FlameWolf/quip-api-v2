"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const votesAggregationPipeline = (userId: string | ObjectId, lastVoteId?: string | ObjectId) => [
	{
		$match: {
			_id: new ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "votes",
			localField: "_id",
			foreignField: "user",
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastVoteId
						? {
								_id: {
									$lt: new ObjectId(lastVoteId)
								}
						  }
						: {
								$expr: true
						  }
				},
				{
					$lookup: {
						from: "posts",
						foreignField: "attachments.poll._id",
						localField: "poll",
						as: "post"
					}
				},
				{
					$unwind: "$post"
				},
				{
					$limit: 20
				}
			],
			as: "votes"
		}
	},
	{
		$unwind: "$votes"
	},
	{
		$replaceWith: "$votes.post"
	},
	...postAggregationPipeline(userId)
];

export default votesAggregationPipeline;