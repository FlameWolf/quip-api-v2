"use strict";

import { ObjectId } from "mongodb";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const postRepliesAggregationPipeline = (postId: string | ObjectId, userId?: string | ObjectId, lastReplyId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			replyTo: new ObjectId(postId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	...filtersAggregationPipeline(userId),
	{
		$match: lastReplyId
			? {
					_id: {
						$lt: new ObjectId(lastReplyId)
					}
				}
			: ({ $expr: true } as any)
	},
	{
		$limit: maxRowsPerFetch
	},
	...postAggregationPipeline(userId)
];

export default postRepliesAggregationPipeline;