"use strict";

import mongoose from "mongoose";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
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
	const session = await mongoose.startSession();
	try {
		const bookmarked = await new Bookmark({
			post: postId,
			bookmarkedBy: userId
		}).save({ session });
		User.findByIdAndUpdate(userId, {
			$addToSet: {
				bookmarks: postId
			}
		}).session(session);
		reply.status(200).send({ bookmarked });
	} finally {
		await session.endSession();
	}
};
export const removeBookmark: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unbookmarked = await Bookmark.findOneAndDelete({
			post: postId,
			bookmarkedBy: userId
		}).session(session);
		if (unbookmarked) {
			User.findByIdAndUpdate(userId, {
				$pull: {
					bookmarks: postId
				}
			}).session(session);
		}
		reply.status(200).send({ unbookmarked });
	} finally {
		await session.endSession();
	}
};