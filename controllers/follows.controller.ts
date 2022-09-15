"use strict";

import mongoose from "mongoose";
import * as usersController from "./users.controller";
import Block from "../models/block.model";
import User from "../models/user.model";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import { RouteHandlerMethod } from "fastify";
import { UserInteractParams } from "../requestDefinitions/users.requests";

export const followUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: followeeHandle } = request.params as UserInteractParams;
	const { handle: followerHandle, userId: followerUserId } = request.userInfo as UserInfo;
	if (followeeHandle === followerHandle) {
		reply.status(422).send("User cannot follow themselves");
		return;
	}
	const followee = await usersController.findActiveUserByHandle(followeeHandle);
	if (!followee) {
		reply.status(404).send("User not found");
		return;
	}
	const followeeUserId = followee._id;
	if (await Block.countDocuments({ user: followerUserId, blockedBy: followeeUserId })) {
		reply.status(403).send("User has blocked you from following them");
		return;
	}
	if (await Block.countDocuments({ user: followeeUserId, blockedBy: followerUserId })) {
		reply.status(403).send("Unblock this user before trying to follow them");
		return;
	}
	if (followee.protected) {
		const requested = await new FollowRequest({
			user: followeeUserId,
			requestedBy: followerUserId
		}).save();
		reply.status(200).send({ requested });
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const followed = await new Follow({
				user: followeeUserId,
				followedBy: followerUserId
			}).save({ session });
			await User.findByIdAndUpdate(followerUserId, {
				$addToSet: {
					follows: followeeUserId
				}
			}).session(session);
			reply.status(200).send({ followed });
		});
	} finally {
		await session.endSession();
	}
};
export const unfollowUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: unfolloweeHandle } = request.params as UserInteractParams;
	const { handle: unfollowerHandle, userId: unfollowerUserId } = request.userInfo as UserInfo;
	if (unfolloweeHandle === unfollowerHandle) {
		reply.status(422).send("User cannot unfollow themselves");
		return;
	}
	const unfollowee = await usersController.findUserByHandle(unfolloweeHandle);
	if (!unfollowee) {
		reply.status(404).send("User not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unfolloweeUserId = unfollowee._id;
			const unfollowed = await Follow.findOneAndDelete({ user: unfolloweeUserId, followedBy: unfollowerUserId }).session(session);
			if (unfollowed) {
				await User.findByIdAndUpdate(unfollowerUserId, {
					$pull: {
						follows: unfolloweeUserId
					}
				}).session(session);
			}
			reply.status(200).send({ unfollowed });
		});
	} finally {
		await session.endSession();
	}
};