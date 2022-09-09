"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import postAggregationPipeline from "./post";

const postParentAggregationPipeline = (postId: string | ObjectId, userId?: string | ObjectId): Array<PipelineStage> => [
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
		$replaceRoot: {
			newRoot: "$parent"
		}
	},
	...postAggregationPipeline(userId)
];

export default postParentAggregationPipeline;