"use strict";

import mongoose from "mongoose";
import * as usersController from "./users.controller";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import List from "../models/list.model";
import ListMember from "../models/list-member.model";
import User from "../models/user.model";
import Block from "../models/block.model";
import { RouteHandlerMethod } from "fastify";
import { BlockUserQueryString, UserInteractParams } from "../requestDefinitions/users.requests";

export const blockUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: blockeeHandle } = request.params as UserInteractParams;
	const { reason: blockReason } = request.query as BlockUserQueryString;
	const { handle: blockerHandle, userId: blockerUserId } = request.userInfo as UserInfo;
	if (blockeeHandle === blockerHandle) {
		reply.status(422).send("User cannot block themselves");
		return;
	}
	const session = await mongoose.startSession();
	try {
		const blockee = await usersController.findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			reply.status(404).send("User not found");
			return;
		}
		await session.withTransaction(async () => {
			const blockeeUserId = blockee._id;
			const blocked = await new Block({
				user: blockeeUserId,
				blockedBy: blockerUserId,
				reason: blockReason
			}).save({ session });
			await Promise.all([
				FollowRequest.deleteOne({
					user: blockeeUserId,
					requestedBy: blockerUserId
				}).session(session),
				FollowRequest.deleteOne({
					user: blockerUserId,
					requestedBy: blockeeUserId
				}).session(session),
				Follow.deleteOne({
					user: blockeeUserId,
					followedBy: blockerUserId
				}).session(session),
				Follow.deleteOne({
					user: blockerUserId,
					followedBy: blockeeUserId
				}).session(session),
				ListMember.deleteMany({
					list: await List.find({ owner: blockerUserId }, { _id: 1 }),
					user: blockeeUserId
				}).session(session),
				ListMember.deleteMany({
					list: await List.find({ owner: blockeeUserId }, { _id: 1 }),
					user: blockerUserId
				}).session(session),
				User.findByIdAndUpdate(blockerUserId, {
					$addToSet: {
						blocks: blockeeUserId
					}
				}).session(session)
			]);
			reply.status(200).send({ blocked });
		});
	} finally {
		await session.endSession();
	}
};
export const unblockUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: unblockeeHandle } = request.params as UserInteractParams;
	const { handle: unblockerHandle, userId: unblockerUserId } = request.userInfo as UserInfo;
	if (unblockeeHandle === unblockerHandle) {
		reply.status(422).send("User cannot unblock themselves");
		return;
	}
	const unblockee = await usersController.findUserByHandle(unblockeeHandle);
	if (!unblockee) {
		reply.status(404).send("User not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unblockeeUserId = unblockee._id;
			const unblocked = await Block.findOneAndDelete({ user: unblockeeUserId, blockedBy: unblockerUserId }).session(session);
			if (unblocked) {
				await User.findByIdAndUpdate(unblockerUserId, {
					$pull: {
						blocks: unblockeeUserId
					}
				}).session(session);
			}
			reply.status(200).send({ unblocked });
		});
	} finally {
		await session.endSession();
	}
};