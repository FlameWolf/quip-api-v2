"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const getPageConditions = (lastDistance: any, lastPostId: any) => {
	const pageConditions: any = {};
	if (lastDistance && lastPostId) {
		const parsedLastDistance = parseFloat(lastDistance);
		pageConditions.$expr = {
			$or: [
				{
					$and: [
						{
							$eq: ["$distance", parsedLastDistance]
						},
						{
							$lt: ["$_id", new ObjectId(lastPostId)]
						}
					]
				},
				{
					$gt: ["$distance", parsedLastDistance]
				}
			]
		};
	}
	return pageConditions;
};
const nearbyPostsAggregationPipeline = ([longitude, latitude]: Array<number>, maxDistance: number = 5000, userId: any = undefined, lastDistance: any = undefined, lastPostId: any = undefined) => [
	{
		$geoNear: {
			near: {
				type: "Point",
				coordinates: [longitude, latitude]
			},
			maxDistance,
			distanceField: "distance"
		}
	},
	{
		$sort: {
			distance: 1,
			createdAt: -1
		}
	},
	{
		$match: getPageConditions(lastDistance, lastPostId)
	},
	{
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

export default nearbyPostsAggregationPipeline;