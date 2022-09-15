"use strict";

import mongoose from "mongoose";
import * as usersController from "./users.controller";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
import MutedUser from "../models/muted.user.model";
import MutedPost from "../models/muted.post.model";
import MutedWord from "../models/muted.word.model";
import { RouteHandlerMethod } from "fastify";
import { PostInteractParams } from "../requestDefinitions/posts.requests";
import { WordMuteBody } from "../requestDefinitions/settings.requests";
import { UserInteractParams } from "../requestDefinitions/users.requests";

export const muteUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: muteeHandle } = request.params as UserInteractParams;
	const { handle: muterHandle, userId: muterUserId } = request.userInfo as UserInfo;
	if (muteeHandle === muterHandle) {
		reply.status(422).send("User cannot mute themselves");
		return;
	}
	const mutee = await usersController.findActiveUserByHandle(muteeHandle);
	if (!mutee) {
		reply.status(404).send("User not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const muteeUserId = mutee._id;
			const muted = await new MutedUser({ user: muteeUserId, mutedBy: muterUserId }).save({ session });
			await User.findByIdAndUpdate(muterUserId, {
				$addToSet: {
					mutedUsers: muteeUserId
				}
			}).session(session);
			reply.status(200).send({ muted });
		});
	} finally {
		await session.endSession();
	}
};
export const unmuteUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: unmuteeHandle } = request.params as UserInteractParams;
	const { handle: unmuterHandle, userId: unmuterUserId } = request.userInfo as UserInfo;
	if (unmuteeHandle === unmuterHandle) {
		reply.status(422).send("User cannot unmute themselves");
		return;
	}
	const unmutee = await usersController.findUserByHandle(unmuteeHandle);
	if (!unmutee) {
		reply.status(404).send("User not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unmuteeUserId = unmutee._id;
			const unmuted = await MutedUser.findOneAndDelete({ user: unmuteeUserId, mutedBy: unmuterUserId }).session(session);
			if (unmuted) {
				await User.findByIdAndUpdate(unmuterUserId, {
					$pull: {
						mutedUsers: unmuteeUserId
					}
				}).session(session);
			}
			reply.status(200).send({ unmuted });
		});
	} finally {
		await session.endSession();
	}
};
export const mutePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const muted = await new MutedPost({ post: postId, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedPosts: postId
				}
			}).session(session);
			reply.status(200).send({ muted });
		});
	} finally {
		await session.endSession();
	}
};
export const unmutePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unmuted = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId }).session(session);
			if (unmuted) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedPosts: postId
					}
				}).session(session);
			}
			reply.status(200).send({ unmuted });
		});
	} finally {
		await session.endSession();
	}
};
export const muteWord: RouteHandlerMethod = async (request, reply) => {
	const { word, match } = request.body as WordMuteBody;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const muted = await new MutedWord({ word, match, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedWords: { word, match }
				}
			}).session(session);
			reply.status(200).send({ muted });
		});
	} finally {
		await session.endSession();
	}
};
export const unmuteWord: RouteHandlerMethod = async (request, reply) => {
	const { word, match } = request.body as WordMuteBody;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unmuted = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId }).session(session);
			if (unmuted) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedWords: { word, match }
					}
				}).session(session);
			}
			reply.status(200).send({ unmuted });
		});
	} finally {
		await session.endSession();
	}
};