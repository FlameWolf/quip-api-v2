"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";

const filtersAggregationPipeline = (userId?: string | ObjectId): Array<PipelineStage> => {
	if (!userId) {
		return [];
	}
	const userObjectId = new ObjectId(userId);
	return [
		{
			$lookup: {
				from: "blocks",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$blockedBy", userObjectId]
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$user"
							}
						}
					}
				],
				as: "blockedUsers"
			}
		},
		{
			$addFields: {
				blockedUsers: {
					$ifNull: [
						{
							$arrayElemAt: ["$blockedUsers.result", 0]
						},
						[]
					]
				}
			}
		},
		{
			$lookup: {
				from: "mutedusers",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$mutedBy", userObjectId]
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$user"
							}
						}
					}
				],
				as: "mutedUsers"
			}
		},
		{
			$addFields: {
				mutedUsers: {
					$ifNull: [
						{
							$arrayElemAt: ["$mutedUsers.result", 0]
						},
						[]
					]
				}
			}
		},
		{
			$lookup: {
				from: "mutedposts",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$mutedBy", userObjectId]
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$post"
							}
						}
					}
				],
				as: "mutedPosts"
			}
		},
		{
			$addFields: {
				mutedPosts: {
					$ifNull: [
						{
							$arrayElemAt: ["$mutedPosts.result", 0]
						},
						[]
					]
				}
			}
		},
		{
			$lookup: {
				from: "mutedwords",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$mutedBy", userObjectId]
							}
						}
					},
					{
						$project: {
							_id: 0,
							regEx: {
								$switch: {
									branches: [
										{
											case: {
												$eq: ["$match", "startsWith"]
											},
											then: {
												$concat: ["\\b", "$word", ".*?\\b"]
											}
										},
										{
											case: {
												$eq: ["$match", "endsWith"]
											},
											then: {
												$concat: ["\\b\\w*?", "$word", "\\b"]
											}
										},
										{
											case: {
												$eq: ["$match", "exact"]
											},
											then: {
												$concat: ["\\b", "$word", "\\b"]
											}
										}
									],
									default: "$word"
								}
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$regEx"
							}
						}
					}
				],
				as: "mutedWords"
			}
		},
		{
			$addFields: {
				mutedWords: {
					$ifNull: [
						{
							$arrayElemAt: ["$mutedWords.result", 0]
						},
						[]
					]
				}
			}
		},
		{
			$match: {
				$expr: {
					$and: [
						{
							$not: {
								$in: ["$author", "$blockedUsers"]
							}
						},
						{
							$not: {
								$or: [
									{
										$in: ["$author", "$mutedUsers"]
									},
									{
										$in: ["$repeatedBy", "$mutedUsers"]
									}
								]
							}
						},
						{
							$not: {
								$in: ["$_id", "$mutedPosts"]
							}
						},
						{
							$eq: [
								{
									$filter: {
										input: "$mutedWords",
										cond: {
											$regexMatch: {
												input: "$content",
												regex: "$$this",
												options: "i"
											}
										}
									}
								},
								[]
							]
						}
					]
				}
			}
		},
		{
			$unset: ["blockedUsers", "mutedUsers", "mutedPosts", "mutedWords"]
		}
	];
};

export default filtersAggregationPipeline;