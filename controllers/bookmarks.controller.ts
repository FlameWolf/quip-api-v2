"use strict";

import * as postsController from "./posts.controller";
import Bookmark from "../models/bookmark.model";
import { RouteHandlerMethod } from "fastify";
import { PostInteractParams } from "../requestDefinitions/posts.requests";

export const addBookmark: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	const bookmarked = await new Bookmark({
		post: postId,
		bookmarkedBy: userId
	});
	reply.status(200).send({ bookmarked });
};
export const removeBookmark: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const unbookmarked = await Bookmark.findOneAndDelete({
		post: postId,
		bookmarkedBy: userId
	});
	reply.status(200).send({ unbookmarked });
};