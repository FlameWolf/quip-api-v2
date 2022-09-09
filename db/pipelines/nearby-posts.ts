"use strict";

import { ObjectId } from "bson";
import { FilterQuery, PipelineStage } from "mongoose";
import postAggregationPipeline from "./post";

const getPageConditions = (lastDistance?: number, lastPostId?: string | ObjectId): FilterQuery<any> => {
	const pageConditions: FilterQuery<any> = {};
	if (lastDistance && lastPostId) {
		pageConditions.$expr = {
			$or: [
				{
					$and: [
						{
							$eq: ["$distance", lastDistance]
						},
						{
							$lt: ["$_id", new ObjectId(lastPostId)]
						}
					]
				},
				{
					$gt: ["$distance", lastDistance]
				}
			]
		};
	}
	return pageConditions;
};
const nearbyPostsAggregationPipeline = ([longitude, latitude]: Array<number>, maxDistance: number = 5000, userId?: string | ObjectId, lastDistance?: number, lastPostId?: string | ObjectId): Array<PipelineStage> => [
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