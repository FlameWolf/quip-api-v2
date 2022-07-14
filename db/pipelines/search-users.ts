"use strict";

import { ObjectId } from "bson";
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
const searchUsersAggregationPipeline = (searchText: string, match: string = "startsWith", dateOrder: string = "desc", selfId: any = undefined, lastUserId: any = undefined): Array<any> => {
	const sortConditions: any = {};
	const pageConditions: any = {};
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
			$limit: 20
		},
		...userAggregationPipeline(selfId)
	];
};

export default searchUsersAggregationPipeline;