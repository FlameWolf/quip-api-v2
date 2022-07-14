"use strict";

import { ObjectId } from "bson";

const userAggregationPipeline = (selfId: any = undefined): Array<any> => {
	const lookupStages = [];
	if (selfId) {
		const selfObjectId = new ObjectId(selfId);
		lookupStages.push(
			{
				$addFields: {
					self: {
						$cond: [
							{
								$eq: ["$_id", selfObjectId]
							},
							true,
							"$$REMOVE"
						]
					}
				}
			},
			{
				$lookup: {
					from: "blocks",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								blockedBy: selfObjectId
							}
						}
					],
					as: "blockedByMe"
				}
			},
			{
				$addFields: {
					blockedByMe: {
						$cond: [
							{
								$eq: ["$blockedByMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					},
					blockedReason: {
						$arrayElemAt: ["$blockedByMe.reason", 0]
					}
				}
			},
			{
				$lookup: {
					from: "blocks",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$blockedBy"] }
							}
						}
					],
					as: "blockedMe"
				}
			},
			{
				$addFields: {
					blockedMe: {
						$cond: [
							{
								$eq: ["$blockedMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			},
			{
				$lookup: {
					from: "followrequests",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								requestedBy: selfObjectId
							}
						}
					],
					as: "requestedToFollowByMe"
				}
			},
			{
				$addFields: {
					requestedToFollowByMe: {
						$cond: [
							{
								$eq: ["$requestedToFollowByMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			},
			{
				$lookup: {
					from: "followrequests",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$requestedBy"] }
							}
						}
					],
					as: "requestedToFollowMe"
				}
			},
			{
				$addFields: {
					requestedToFollowMe: {
						$cond: [
							{
								$eq: ["$requestedToFollowMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			},
			{
				$lookup: {
					from: "follows",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								followedBy: selfObjectId
							}
						}
					],
					as: "followedByMe"
				}
			},
			{
				$addFields: {
					followedByMe: {
						$cond: [
							{
								$eq: ["$followedByMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			},
			{
				$lookup: {
					from: "follows",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$followedBy"] }
							}
						}
					],
					as: "followedMe"
				}
			},
			{
				$addFields: {
					followedMe: {
						$cond: [
							{
								$eq: ["$followedMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			},
			{
				$lookup: {
					from: "mutedusers",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								mutedBy: selfObjectId
							}
						}
					],
					as: "mutedByMe"
				}
			},
			{
				$addFields: {
					mutedByMe: {
						$cond: [
							{
								$eq: ["$mutedByMe", []]
							},
							{
								$cond: [
									{
										$eq: ["$self", true]
									},
									"$$REMOVE",
									false
								]
							},
							true
						]
					}
				}
			}
		);
	}
	return [
		{
			$project: {
				handle: 1,
				pinnedPost: 1,
				protected: 1,
				deactivated: 1
			}
		},
		...lookupStages
	];
};

export default userAggregationPipeline;