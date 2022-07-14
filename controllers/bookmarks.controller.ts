"use strict";

import * as postsController from "./posts.controller";
import Bookmark from "../models/bookmark.model";
import { FastifyRequest, FastifyReply } from "fastify";
import { PostInteractParams } from "../requestDefinitions/posts.requests";

export const addBookmark = async (request: FastifyRequest, reply: FastifyReply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	const bookmarked = await new Bookmark({
		post: post._id,
		bookmarkedBy: userId
	}).save();
	reply.status(200).send({ bookmarked });
};
export const removeBookmark = async (request: FastifyRequest, reply: FastifyReply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const unbookmarked = await Bookmark.findOneAndDelete({
		post: postId,
		bookmarkedBy: userId
	});
	reply.status(200).send({ unbookmarked });
};