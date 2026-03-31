"use strict";

import mongoose from "mongoose";
import { favouriteScore } from "../library.ts";
import Post from "../models/post.model.ts";
import Favourite from "../models/favourite.model.ts";
import * as postsController from "./posts.controller.ts";
import type { RouteHandlerMethod } from "fastify";
import type { PostInteractParams } from "../requestDefinitions/posts.requests.ts";

export const addFavourite: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const post = await postsController.findPostById(postId);
		if (!post) {
			reply.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = post._id;
			const favourited = await new Favourite({
				post: originalPostId,
				favouritedBy: userId
			}).save({ session });
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: favouriteScore
				}
			}).session(session);
			reply.status(200).send({ favourited });
		});
	} finally {
		await session.endSession();
	}
};
export const removeFavourite: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unfavourited = await Favourite.findOneAndDelete({
				post: postId,
				favouritedBy: userId
			}).session(session);
			if (unfavourited) {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: -favouriteScore
					}
				}).session(session);
			}
			reply.status(200).send({ unfavourited });
		});
	} finally {
		await session.endSession();
	}
};