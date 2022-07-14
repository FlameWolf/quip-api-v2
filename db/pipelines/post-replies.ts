"use strict";

import { ObjectId } from "bson";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const postRepliesAggregationPipeline = (postId: any, userId: any = undefined, lastReplyId: any = undefined) => [
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
			: {
					$expr: true
			  }
	},
	{
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

export default postRepliesAggregationPipeline;