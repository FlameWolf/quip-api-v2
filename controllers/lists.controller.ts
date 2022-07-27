"use strict";

import mongoose from "mongoose";
import listPostsAggregationPipeline from "../db/pipelines/list-posts";
import * as usersController from "./users.controller";
import Follow from "../models/follow.model";
import Block from "../models/block.model";
import List from "../models/list.model";
import ListMember from "../models/list-member.model";
import { RouteHandlerMethod } from "fastify";
import { ListInteractParams, ListPostsQueryString, ListCreateBody, ListMemberBody, ListUpdateBody } from "../requestDefinitions/lists.requests";

const findListPostsByNameAndOwnerId = async (listName: string, ownerId: any, includeRepeats = true, includeReplies = true, lastPostId: any = undefined) => await List.aggregate(listPostsAggregationPipeline(listName, ownerId, includeRepeats, includeReplies, lastPostId));
export const createList: RouteHandlerMethod = async (request, reply) => {
	const { name, includeRepeats, includeReplies } = request.body as ListCreateBody;
	const userId = (request.userInfo as UserInfo).userId;
	const list = await new List({ name, owner: userId, includeRepeats, includeReplies }).save();
	reply.status(201).send({ list });
};
export const updateList: RouteHandlerMethod = async (request, reply) => {
	const { name, newName, includeRepeats, includeReplies } = request.body as ListUpdateBody;
	const userId = (request.userInfo as UserInfo).userId;
	const filter = { name, owner: userId };
	if (!(await List.countDocuments(filter))) {
		reply.status(404).send("List not found");
		return;
	}
	if (newName && name !== newName) {
		if (await List.countDocuments({ name: newName, owner: userId })) {
			reply.status(409).send("You already have another list by that name");
			return;
		}
	}
	const updated = await List.findOneAndUpdate(filter, { name: newName, includeRepeats, includeReplies }, { new: true });
	reply.status(200).send({ updated });
};
export const addMember: RouteHandlerMethod = async (request, reply) => {
	const { name, handle } = request.body as ListMemberBody;
	const userId = (request.userInfo as UserInfo).userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		reply.status(404).send("List not found");
		return;
	}
	const member = await usersController.findActiveUserByHandle(handle);
	if (!member) {
		reply.status(404).send("User not found");
		return;
	}
	const memberId = member._id;
	if (member.protected && !(await Follow.findOne({ user: memberId, followedBy: userId }))) {
		reply.status(403).send("You are not allowed to perform this action");
		return;
	}
	if (await Block.countDocuments({ user: userId, blockedBy: memberId })) {
		reply.status(403).send("User has blocked you from adding them to lists");
		return;
	}
	if (await Block.countDocuments({ user: memberId, blockedBy: userId })) {
		reply.status(403).send("Unblock this user to add them to lists");
		return;
	}
	const added = await new ListMember({ list: list._id, user: memberId }).save();
	reply.status(200).send({ added });
};
export const removeMember: RouteHandlerMethod = async (request, reply) => {
	const { name, handle } = request.body as ListMemberBody;
	const userId = (request.userInfo as UserInfo).userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		reply.status(404).send("List not found");
		return;
	}
	const member = await usersController.findUserByHandle(handle);
	if (!member) {
		reply.status(404).send("User not found");
		return;
	}
	const memberId = member._id;
	const removed = await ListMember.findOneAndDelete({ list: list._id, user: memberId });
	reply.status(200).send({ removed });
};
export const getPosts: RouteHandlerMethod = async (request, reply) => {
	const { name } = request.params as ListInteractParams;
	const { includeRepeats, includeReplies, lastPostId } = request.query as ListPostsQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const posts = await findListPostsByNameAndOwnerId(name, userId, includeRepeats, includeReplies, lastPostId);
	reply.status(200).send({ posts });
};
export const deleteList: RouteHandlerMethod = async (request, reply) => {
	const { name } = request.params as ListInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const deleted = await List.findOneAndDelete({ name, owner: userId }).session(session);
			if (deleted) {
				await ListMember.deleteMany({ list: deleted._id }).session(session);
			}
			reply.status(200).send({ deleted });
		});
	} finally {
		await session.endSession();
	}
};