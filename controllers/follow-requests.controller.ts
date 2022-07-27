"use strict";

import mongoose, { FilterQuery } from "mongoose";
import * as usersController from "./users.controller";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import { RouteHandlerMethod } from "fastify";
import { UserInteractParams } from "../requestDefinitions/users.requests";
import { FollowRequestBody, RequestApprovalParams } from "../requestDefinitions/settings.requests";

const batchSize = 65536;

export const acceptFollowRequest: RouteHandlerMethod = async (request, reply) => {
	const { requestId: followRequestId } = request.params as RequestApprovalParams;
	const acceptorUserId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const followRequest = await FollowRequest.findOne(
			{
				user: acceptorUserId,
				_id: followRequestId
			},
			{
				requestedBy: 1
			}
		);
		if (!followRequest) {
			reply.status(404).send(new Error("Follow request not found"));
		}
		await session.withTransaction(async () => {
			await FollowRequest.deleteOne(followRequest?.toJSON() as FilterQuery<any>).session(session);
			const accepted = await new Follow({
				user: acceptorUserId,
				followedBy: followRequest?.requestedBy
			}).save({ session });
			reply.status(200).send({ accepted });
		});
	} finally {
		await session.endSession();
	}
};
export const acceptSelectedFollowRequests: RouteHandlerMethod = async (request, reply) => {
	const { requestIds: followRequestIds } = request.body as FollowRequestBody;
	const acceptorUserId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const filter = {
				user: acceptorUserId,
				_id: {
					$in: followRequestIds
				}
			};
			await FollowRequest.deleteMany(filter).session(session);
			const result = await Follow.bulkSave(
				(
					await FollowRequest.find(filter, {
						_id: 0,
						user: acceptorUserId,
						followedBy: "$requestedBy"
					})
				).map(followRequest => new Follow(followRequest)),
				{ session }
			);
			reply.status(200).send({ acceptedRequestsCount: result.insertedCount });
		});
	} finally {
		await session.endSession();
	}
};
export const acceptAllFollowRequests: RouteHandlerMethod = async (request, reply) => {
	const acceptorUserId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		let batchCount = 0;
		let totalCount = 0;
		await session.withTransaction(async () => {
			const filter = { user: acceptorUserId };
			do {
				const followRequests: Array<any> = await FollowRequest.find(filter, { user: acceptorUserId, followedBy: "$requestedBy" }).limit(batchSize).session(session);
				await FollowRequest.deleteMany({
					_id: {
						$in: followRequests.map(followRequest => followRequest._id)
					}
				}).session(session);
				followRequests.forEach(followRequest => delete followRequest._id);
				const result = await Follow.bulkSave(
					followRequests.map(followRequest => new Follow(followRequest)),
					{ session }
				);
				batchCount = result.insertedCount;
				totalCount += batchCount;
			} while (batchCount === batchSize);
		});
		reply.status(200).send({ acceptedRequestsCount: totalCount });
	} finally {
		await session.endSession();
	}
};
export const cancelFollowRequest: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const cancellerUserId = (request.userInfo as UserInfo).userId;
	const user = await usersController.findUserByHandle(handle);
	if (!user) {
		reply.status(404).send("User not found");
		return;
	}
	const cancelled = await FollowRequest.findOneAndDelete({
		user: user._id,
		requestedBy: cancellerUserId
	});
	reply.status(200).send({ cancelled });
};
export const rejectFollowRequest: RouteHandlerMethod = async (request, reply) => {
	const { requestId: followRequestId } = request.params as RequestApprovalParams;
	const rejectorUserId = (request.userInfo as UserInfo).userId;
	const rejected = await FollowRequest.findOneAndDelete({
		user: rejectorUserId,
		_id: followRequestId
	});
	reply.status(200).send({ rejected });
};
export const rejectSelectedFollowRequests: RouteHandlerMethod = async (request, reply) => {
	const { requestIds: followRequestIds } = request.body as FollowRequestBody;
	const rejectorUserId = (request.userInfo as UserInfo).userId;
	const result = await FollowRequest.deleteMany({
		user: rejectorUserId,
		_id: {
			$in: followRequestIds
		}
	});
	reply.status(200).send({ rejectedRequestsCount: result.deletedCount });
};
export const rejectAllFollowRequests: RouteHandlerMethod = async (request, reply) => {
	const rejectorUserId = (request.userInfo as UserInfo).userId;
	const result = await FollowRequest.deleteMany({ user: rejectorUserId });
	reply.status(200).send({ rejectedRequestsCount: result.deletedCount });
};