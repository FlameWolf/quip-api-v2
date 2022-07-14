"use strict";

import { ObjectId } from "bson";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const listPostsAggregationPipeline = (listName: string, ownerId: any, includeRepeats: boolean = true, includeReplies: boolean = true, lastPostId: any = undefined): Array<any> => {
	const matchConditions = {
		...(!includeRepeats && {
			repeatPost: {
				$eq: null
			}
		}),
		...(!includeReplies && {
			replyTo: {
				$eq: null
			}
		}),
		...(lastPostId && {
			_id: {
				$lt: new ObjectId(lastPostId)
			}
		})
	};
	return [
		{
			$match: {
				name: listName,
				owner: new ObjectId(ownerId)
			}
		},
		{
			$lookup: {
				from: "listmembers",
				localField: "_id",
				foreignField: "list",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "user",
							foreignField: "_id",
							pipeline: [
								{
									$match: {
										deactivated: false,
										deleted: false
									}
								}
							],
							as: "activeUser"
						}
					},
					{
						$unwind: "$activeUser"
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
				as: "members"
			}
		},
		{
			$lookup: {
				from: "posts",
				let: {
					members: {
						$ifNull: [
							{
								$arrayElemAt: ["$members.result", 0]
							},
							[]
						]
					}
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$in: ["$author", "$$members"]
							}
						}
					},
					{
						$match: Object.keys(matchConditions).length ? matchConditions : { $expr: true }
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					{
						$limit: 10000
					},
					...(includeRepeats
						? [
								{
									$lookup: {
										from: "posts",
										localField: "repeatPost",
										foreignField: "_id",
										let: {
											repeatedBy: "$author"
										},
										pipeline: [
											{
												$addFields: {
													repeatedBy: "$$repeatedBy"
												}
											}
										],
										as: "repeatedPost"
									}
								},
								{
									$unwind: {
										path: "$repeatedPost",
										preserveNullAndEmptyArrays: true
									}
								},
								{
									$replaceWith: {
										$ifNull: ["$repeatedPost", "$$ROOT"]
									}
								}
						  ]
						: []),
					...filtersAggregationPipeline(ownerId),
					{
						$match: lastPostId
							? {
									_id: {
										$lt: new ObjectId(lastPostId)
									}
							  }
							: {
									$expr: true
							  }
					},
					{
						$limit: 20
					},
					{
						$lookup: {
							from: "users",
							localField: "repeatedBy",
							foreignField: "_id",
							pipeline: [
								{
									$project: {
										handle: 1
									}
								}
							],
							as: "repeatedBy"
						}
					},
					{
						$unwind: {
							path: "$repeatedBy",
							preserveNullAndEmptyArrays: true
						}
					},
					...postAggregationPipeline(ownerId)
				],
				as: "posts"
			}
		},
		{
			$project: {
				_id: 0,
				posts: 1
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceWith: "$posts"
		}
	];
};

export default listPostsAggregationPipeline;