"use strict";

import mongoose from "mongoose";
import FollowRequest from "../models/follow-request.model.ts";
import Follow from "../models/follow.model.ts";
import List from "../models/list.model.ts";
import ListMember from "../models/list-member.model.ts";
import User from "../models/user.model.ts";
import Block from "../models/block.model.ts";
import * as usersController from "./users.controller.ts";
import type { RouteHandlerMethod } from "fastify";
import type { UserInteractParams, ActionReasonQuery } from "../requestDefinitions/users.requests.ts";

export const blockUser: RouteHandlerMethod = async (request, reply) => {
	const { handle: blockeeHandle } = request.params as UserInteractParams;
	const { reason: blockReason } = request.query as ActionReasonQuery;
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
		const blocked = await session.withTransaction(async () => {
			const blockeeUserId = blockee._id;
			const blockedUser = await new Block({
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
					$pull: {
						follows: blockeeUserId
					},
					$addToSet: {
						blockedUsers: blockeeUserId
					}
				}).session(session),
				List.updateMany(
					{ owner: blockerUserId },
					{
						$pull: {
							members: blockeeUserId
						}
					}
				).session(session),
				List.updateMany(
					{ owner: blockeeUserId },
					{
						$pull: {
							members: blockerUserId
						}
					}
				).session(session)
			]);
			return blockedUser;
		});
		reply.status(200).send({ blocked });
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
		const unblocked = await session.withTransaction(async () => {
			const unblockeeUserId = unblockee._id;
			const unblockedUser = await Block.findOneAndDelete({ user: unblockeeUserId, blockedBy: unblockerUserId }).session(session);
			if (unblockedUser) {
				await User.findByIdAndUpdate(unblockerUserId, {
					$pull: {
						blockedUsers: unblockeeUserId
					}
				}).session(session);
			}
			return unblockedUser;
		});
		reply.status(200).send({ unblocked });
	} finally {
		await session.endSession();
	}
};