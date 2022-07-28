"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const postParentAggregationPipeline = (postId: string | ObjectId, userId?: string | ObjectId) => [
	{
		$match: {
			_id: new ObjectId(postId)
		}
	},
	{
		$lookup: {
			from: "posts",
			localField: "replyTo",
			foreignField: "_id",
			as: "parent"
		}
	},
	{
		$unwind: "$parent"
	},
	{
		$replaceWith: "$parent"
	},
	...postAggregationPipeline(userId)
];

export default postParentAggregationPipeline;