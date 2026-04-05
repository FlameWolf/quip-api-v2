"use strict";

import searchPostsAggregationPipeline from "../db/pipelines/search-posts.ts";
import nearbyPostsAggregationPipeline from "../db/pipelines/nearby-posts.ts";
import searchUsersAggregationPipeline from "../db/pipelines/search-users.ts";
import Post from "../models/post.model.ts";
import User from "../models/user.model.ts";
import type { RouteHandlerMethod } from "fastify";
import type { SearchNearbyQuery, SearchQuery, SearchUsersQuery } from "../requestDefinitions/search.requests.ts";

export const searchPosts: RouteHandlerMethod = async (request, reply) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, replies, langs: languages, "langs-match": includeLanguages, "media-desc": mediaDescription, lastScore, lastPostId } = request.query as SearchQuery;
	const posts = await Post.aggregate(
		searchPostsAggregationPipeline(
			searchText?.trim(),
			{
				from,
				since,
				until,
				hasMedia,
				notFrom,
				replies,
				languages,
				includeLanguages,
				mediaDescription
			},
			sortBy,
			dateOrder,
			(request.userInfo as UserInfo)?.userId,
			lastScore,
			lastPostId
		)
	);
	reply.status(200).send({ posts });
};
export const nearbyPosts: RouteHandlerMethod = async (request, reply) => {
	const { long: longitude, lat: latitude, "max-dist": maxDistance, lastDistance, lastPostId } = request.query as SearchNearbyQuery;
	const posts = await Post.aggregate(nearbyPostsAggregationPipeline([longitude, latitude], maxDistance, (request.userInfo as UserInfo)?.userId, lastDistance, lastPostId));
	reply.status(200).send({ posts });
};
export const searchUsers: RouteHandlerMethod = async (request, reply) => {
	const { q: searchText, match, "date-order": dateOrder, lastUserId } = request.query as SearchUsersQuery;
	if (!searchText) {
		reply.status(400).send("Search text missing");
		return;
	}
	const users = await User.aggregate(searchUsersAggregationPipeline(searchText, match, dateOrder, (request.userInfo as UserInfo)?.userId, lastUserId));
	reply.status(200).send({ users });
};