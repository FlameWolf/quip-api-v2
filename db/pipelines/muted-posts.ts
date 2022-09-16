"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import postAggregationPipeline from "./post";

const mutedPostsAggregationPipeline = (userId: string | ObjectId, lastMuteId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			mutedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMuteId
			? {
					_id: {
						$lt: new ObjectId(lastMuteId)
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
			from: "posts",
			localField: "post",
			foreignField: "_id",
			pipeline: postAggregationPipeline(userId) as Array<any>,
			as: "post"
		}
	},
	{
		$unwind: "$post"
	},
	{
		$project: {
			post: 1
		}
	}
];

export default mutedPostsAggregationPipeline;