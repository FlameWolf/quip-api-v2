"use strict";

import * as usersController from "./users.controller";
import Block from "../models/block.model";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import { FastifyRequest, FastifyReply } from "fastify";
import { UserInteractParams } from "../requestDefinitions/users.requests";

export const followUser = async (request: FastifyRequest, reply: FastifyReply) => {
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
		reply.status(403).send("Unblock this user to start following them");
		return;
	}
	const isFolloweeProtected = followee.protected;
	const model = isFolloweeProtected
		? new FollowRequest({
				user: followeeUserId,
				requestedBy: followerUserId
		  })
		: new Follow({
				user: followeeUserId,
				followedBy: followerUserId
		  });
	const result = await model.save();
	reply.status(200).send({
		[isFolloweeProtected ? "requested" : "followed"]: result
	});
};
export const unfollowUser = async (request: FastifyRequest, reply: FastifyReply) => {
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
	const unfollowed = await Follow.findOneAndDelete({ user: unfollowee._id, followedBy: unfollowerUserId });
	reply.status(200).send({ unfollowed });
};