"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import postAggregationPipeline from "./post";

const votesAggregationPipeline = (userId: string | ObjectId, lastVoteId?: string | ObjectId): Array<PipelineStage> => [
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
								$expr: {
									$eq: true
								}
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
					$limit: maxRowsPerFetch
				}
			],
			as: "votes"
		}
	},
	{
		$unwind: "$votes"
	},
	{
		$replaceRoot: {
			newRoot: "$votes.post"
		}
	},
	...postAggregationPipeline(userId)
];

export default votesAggregationPipeline;