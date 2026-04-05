"use strict";

import mongoose from "mongoose";
import User from "../models/user.model.ts";
import MutedUser from "../models/muted.user.model.ts";
import MutedPost from "../models/muted.post.model.ts";
import MutedWord from "../models/muted.word.model.ts";
import * as usersController from "./users.controller.ts";
import * as postsController from "./posts.controller.ts";
import type { RouteHandlerMethod } from "fastify";
import type { PostInteractParams } from "../requestDefinitions/posts.requests.ts";
import type { WordMuteBody } from "../requestDefinitions/settings.requests.ts";
import type { UserInteractParams, ActionReasonQueryString } from "../requestDefinitions/users.requests.ts";

const getMutedWordRegExp = (word: string, match: string) => {
	switch (match) {
		case "startsWith":
			return `\\b${word}.*?\\b`;
		case "endsWith":
			return `\\b\\w*?${word}\\b`;
		case "exact":
			return `\\b${word}\\b`;
		default:
			return word;
	}
};
export const muteUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: muteeHandle } = request.params as UserInteractParams;
	const { reason: muteReason } = request.query as ActionReasonQueryString;
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
		const muted = await session.withTransaction(async () => {
			const muteeUserId = mutee._id;
			const mutedUser = await new MutedUser({
				user: muteeUserId,
				mutedBy: muterUserId,
				reason: muteReason
			}).save({ session });
			await User.findByIdAndUpdate(muterUserId, {
				$addToSet: {
					mutedUsers: muteeUserId
				}
			}).session(session);
			return mutedUser;
		});
		reply.status(200).send({ muted });
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
		const unmuted = await session.withTransaction(async () => {
			const unmuteeUserId = unmutee._id;
			const unmutedUser = await MutedUser.findOneAndDelete({ user: unmuteeUserId, mutedBy: unmuterUserId }).session(session);
			if (unmutedUser) {
				await User.findByIdAndUpdate(unmuterUserId, {
					$pull: {
						mutedUsers: unmuteeUserId
					}
				}).session(session);
			}
			return unmutedUser;
		});
		reply.status(200).send({ unmuted });
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
		const muted = await session.withTransaction(async () => {
			const mutedPost = await new MutedPost({ post: postId, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedPosts: postId
				}
			}).session(session);
			return mutedPost;
		});
		reply.status(200).send({ muted });
	} finally {
		await session.endSession();
	}
};
export const unmutePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unmuted = await session.withTransaction(async () => {
			const unmutedPost = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId }).session(session);
			if (unmutedPost) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedPosts: postId
					}
				}).session(session);
			}
			return unmutedPost;
		});
		reply.status(200).send({ unmuted });
	} finally {
		await session.endSession();
	}
};
export const muteWord: RouteHandlerMethod = async (request, reply) => {
	const { word, match } = request.body as WordMuteBody;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const muted = await session.withTransaction(async () => {
			const mutedWord = await new MutedWord({ word, match, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedWords: getMutedWordRegExp(word, match)
				}
			}).session(session);
			return mutedWord;
		});
		reply.status(200).send({ muted });
	} finally {
		await session.endSession();
	}
};
export const unmuteWord: RouteHandlerMethod = async (request, reply) => {
	const { word, match } = request.body as WordMuteBody;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unmuted = await session.withTransaction(async () => {
			const unmutedWord = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId }).session(session);
			if (unmutedWord) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedWords: getMutedWordRegExp(word, match)
					}
				}).session(session);
			}
			return unmutedWord;
		});
		reply.status(200).send({ unmuted });
	} finally {
		await session.endSession();
	}
};