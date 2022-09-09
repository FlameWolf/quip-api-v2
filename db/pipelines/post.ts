"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import interactionsAggregationPipeline from "./interactions";

const authorLookupAndUnwind: Array<PipelineStage> = [
	{
		$lookup: {
			from: "users",
			localField: "author",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: {
							$cond: ["$deleted", "[deleted]", "$handle"]
						}
					}
				}
			],
			as: "author"
		}
	},
	{
		$unwind: "$author"
	}
];
const postAggregationPipeline = (userId?: string | ObjectId): Array<PipelineStage> => {
	return [
		{
			$unset: "score"
		},
		...(authorLookupAndUnwind as Array<any>),
		{
			$lookup: {
				from: "posts",
				localField: "attachments.post",
				foreignField: "_id",
				pipeline: authorLookupAndUnwind,
				as: "attachments.post"
			}
		},
		{
			$unwind: {
				path: "$attachments.post",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$addFields: {
				attachments: {
					$cond: [
						{
							$ne: ["$attachments", {}]
						},
						{
							$mergeObjects: [
								"$attachments",
								{
									poll: {
										$cond: [
											{
												$gt: ["$attachments.poll", null]
											},
											{
												$mergeObjects: [
													"$attachments.poll",
													{
														expired: {
															$gt: [
																new Date(),
																{
																	$add: ["$createdAt", "$attachments.poll.duration"]
																}
															]
														}
													}
												]
											},
											"$$REMOVE"
										]
									}
								}
							]
						},
						"$$REMOVE"
					]
				}
			}
		},
		...interactionsAggregationPipeline(userId)
	];
};

export default postAggregationPipeline;