"use strict";

import { ObjectId } from "bson";
import { FilterQuery, PipelineStage, Expression } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import userAggregationPipeline from "./user";

const getMatchExpression = (match: string, searchText: string) => {
	switch (match) {
		case "contains":
			return new RegExp(`${searchText}`, "i");
		case "exact":
			return new RegExp(`^${searchText}$`, "i");
		case "endsWith":
			return new RegExp(`${searchText}$`, "i");
		case "startsWith":
		default:
			return new RegExp(`^${searchText}`, "i");
	}
};
const searchUsersAggregationPipeline = (searchText: string, match: string = "startsWith", dateOrder: string = "desc", selfId?: string | ObjectId, lastUserId?: string | ObjectId): Array<PipelineStage> => {
	const sortConditions: Record<string, any> = {};
	const pageConditions: FilterQuery<any> = {};
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
	sortConditions.createdAt = dateSort;
	if (lastUserId) {
		pageConditions._id = { [idCompare]: new ObjectId(lastUserId) };
	}
	return [
		{
			$match: {
				handle: getMatchExpression(match, searchText),
				deleted: false
			}
		},
		{
			$sort: sortConditions
		},
		{
			$match: pageConditions
		},
		{
			$limit: maxRowsPerFetch
		},
		...userAggregationPipeline(selfId)
	];
};

export default searchUsersAggregationPipeline;