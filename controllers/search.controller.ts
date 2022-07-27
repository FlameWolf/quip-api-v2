"use strict";

import searchPostsAggregationPipeline from "../db/pipelines/search-posts";
import nearbyPostsAggregationPipeline from "../db/pipelines/nearby-posts";
import searchUsersAggregationPipeline from "../db/pipelines/search-users";
import Post from "../models/post.model";
import User from "../models/user.model";
import { RouteHandlerMethod, FastifyRequest, FastifyReply } from "fastify";
import { SearchNearbyQueryString, SearchQueryString, SearchUsersQueryString } from "../requestDefinitions/search.requests";

export const searchPosts: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, replies, langs: languages, "langs-match": includeLanguages, "media-desc": mediaDescription, lastScore, lastPostId } = request.query as SearchQueryString;
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
export const nearbyPosts: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { long: longitude, lat: latitude, "max-dist": maxDistance, lastDistance, lastPostId } = request.query as SearchNearbyQueryString;
	const posts = await Post.aggregate(nearbyPostsAggregationPipeline([longitude, latitude], maxDistance, (request.userInfo as UserInfo)?.userId, lastDistance, lastPostId));
	reply.status(200).send({ posts });
};
export const searchUsers: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { q: searchText, match, "date-order": dateOrder, lastUserId } = request.query as SearchUsersQueryString;
	if (!searchText) {
		reply.status(400).send("Search text missing");
		return;
	}
	const users = await User.aggregate(searchUsersAggregationPipeline(searchText, match, dateOrder, (request.userInfo as UserInfo)?.userId, lastUserId));
	reply.status(200).send({ users });
};