"use strict";

import * as bcrypt from "bcrypt";
import { ObjectId } from "bson";
import { RouteHandlerMethod } from "fastify";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import blocksAggregationPipeline from "../db/pipelines/blocks";
import bookmarksAggregationPipeline from "../db/pipelines/bookmarks";
import favouritesAggregationPipeline from "../db/pipelines/favourites";
import followRequestsReceivedAggregationPipeline from "../db/pipelines/follow-requests-received";
import followRequestsSentAggregationPipeline from "../db/pipelines/follow-requests-sent";
import followersAggregationPipeline from "../db/pipelines/followers";
import followingAggregationPipeline from "../db/pipelines/following";
import listMembersAggregationPipeline from "../db/pipelines/list-members";
import listsAggregationPipeline from "../db/pipelines/lists";
import mentionsAggregationPipeline from "../db/pipelines/mentions";
import mutedPostsAggregationPipeline from "../db/pipelines/muted-posts";
import mutedUsersAggregationPipeline from "../db/pipelines/muted-users";
import mutedWordsAggregationPipeline from "../db/pipelines/muted-words";
import topmostAggregationPipeline from "../db/pipelines/topmost";
import userAggregationPipeline from "../db/pipelines/user";
import userPostsAggregationPipeline from "../db/pipelines/user-posts";
import votesAggregationPipeline from "../db/pipelines/votes";
import { emailTemplates, noReplyEmail, passwordRegExp, rounds } from "../library";
import Block from "../models/block.model";
import Bookmark from "../models/bookmark.model";
import EmailVerification from "../models/email-verification.model";
import Favourite from "../models/favourite.model";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import ListMember from "../models/list-member.model";
import List from "../models/list.model";
import MutedPost from "../models/muted.post.model";
import MutedUser from "../models/muted.user.model";
import MutedWord from "../models/muted.word.model";
import PasswordReset from "../models/password-reset.model";
import Post from "../models/post.model";
import RefreshToken from "../models/refresh-token.model";
import Settings from "../models/settings.model";
import User from "../models/user.model";
import Vote from "../models/vote.model";
import { ListInteractParams, ListMembersQueryString, ListsQueryString } from "../requestDefinitions/lists.requests";
import { PostInteractParams } from "../requestDefinitions/posts.requests";
import { BlockedUsersQueryString, ChangePasswordBody, MutedItemsQueryString, UpdateEmailBody } from "../requestDefinitions/settings.requests";
import { UserBookmarksQueryString, UserFavouritesQueryString, UserFollowRequestsQueryString, UserFollowsQueryString, UserInteractParams, UserMentionsQueryString, UserPostsQueryString, UserTopmostParams, UserTopmostQueryString, UserVotesQueryString } from "../requestDefinitions/users.requests";
import * as emailController from "./email.controller";
import * as postsController from "./posts.controller";

type UserModel = InferSchemaType<typeof User.schema>;

export const findActiveUserByHandle = async (handle: string) => (await User.findOne({ handle, deactivated: false, deleted: false })) as HydratedDocument<UserModel>;
export const findUserById = async (userId: string | ObjectId) => (await User.findOne({ _id: userId, deleted: false })) as HydratedDocument<UserModel>;
export const findUserByHandle = async (handle: string) => (await User.findOne({ handle, deleted: false })) as HydratedDocument<UserModel>;
export const findPostsByUserId = async (userId: ObjectId, includeRepeats?: boolean, includeReplies?: boolean, visitorId?: string | ObjectId, lastPostId?: string | ObjectId) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, visitorId, lastPostId));
export const findFavouritesByUserId = async (userId: string | ObjectId, lastFavouriteId?: string | ObjectId) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
export const findVotesByUserId = async (userId: string | ObjectId, lastVoteId?: string | ObjectId) => await User.aggregate(votesAggregationPipeline(userId, lastVoteId));
export const findBookmarksByUserId = async (userId: string | ObjectId, lastBookmarkId?: string | ObjectId) => await User.aggregate(bookmarksAggregationPipeline(userId, lastBookmarkId));
export const findFollowingByUserId = async (userId: string | ObjectId, lastFollowId?: string | ObjectId) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
export const findFollowersByUserId = async (userId: string | ObjectId, lastFollowId?: string | ObjectId) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
export const findFollowRequestsSentByUserId = async (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId) => await Follow.aggregate(followRequestsSentAggregationPipeline(userId, lastFollowRequestId));
export const findFollowRequestsReceivedByUserId = async (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId) => await Follow.aggregate(followRequestsReceivedAggregationPipeline(userId, lastFollowRequestId));
export const findMentionsByUserId = async (userId: ObjectId, selfId?: string | ObjectId, lastMentionId?: string | ObjectId) => await Post.aggregate(mentionsAggregationPipeline(userId, selfId, lastMentionId));
export const findListsByUserId = async (userId: string | ObjectId, memberId?: string | ObjectId, lastListId?: string | ObjectId) => await List.aggregate(listsAggregationPipeline(userId, memberId, lastListId));
export const findMembersByListId = async (listId: ObjectId, lastMemberId?: string | ObjectId) => await ListMember.aggregate(listMembersAggregationPipeline(listId, lastMemberId));
export const findBlocksByUserId = async (userId: string | ObjectId, lastBlockId?: string | ObjectId) => await Block.aggregate(blocksAggregationPipeline(userId, lastBlockId));
export const findMutedUsersByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => await MutedUser.aggregate(mutedUsersAggregationPipeline(userId, lastMuteId));
export const findMutedPostsByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => await MutedPost.aggregate(mutedPostsAggregationPipeline(userId, lastMuteId));
export const findMutedWordsByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => (await MutedWord.aggregate(mutedWordsAggregationPipeline(userId, lastMuteId))) as Array<{ word: string; match: string }>;
export const getUser: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const user = (
		await User.aggregate([
			{
				$match: {
					handle,
					deactivated: false,
					deleted: false
				}
			},
			...userAggregationPipeline((request.userInfo as UserInfo)?.userId)
		])
	).shift();
	if (!user) {
		reply.status(404).send("User not found");
		return;
	}
	reply.status(200).send({ user });
};
export const getUserPosts: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { includeRepeats, includeReplies, lastPostId } = request.query as UserPostsQueryString;
	const visitorId = (request.userInfo as UserInfo)?.userId;
	const user = await findActiveUserByHandle(handle);
	if (!user) {
		reply.status(404).send("User not found");
		return;
	}
	const posts = await findPostsByUserId(user._id, includeRepeats, includeReplies, visitorId, lastPostId);
	reply.status(200).send({ posts });
};
export const getUserTopmost: RouteHandlerMethod = async (request, reply) => {
	const { handle, period } = request.params as UserTopmostParams;
	const { lastScore, lastPostId } = request.query as UserTopmostQueryString;
	const filter = { handle };
	if (!(await User.countDocuments(filter))) {
		reply.status(404).send("User not found");
		return;
	}
	const posts = await User.aggregate([
		{
			$match: filter
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "author",
				pipeline: topmostAggregationPipeline((request.userInfo as UserInfo)?.userId, period, lastScore, lastPostId) as Array<any>,
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceRoot: {
				newRoot: "$posts"
			}
		}
	]);
	reply.status(200).send({ posts });
};
export const getUserFavourites: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastFavouriteId } = request.query as UserFavouritesQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const favourites = await findFavouritesByUserId(userInfo.userId, lastFavouriteId);
	reply.status(200).send({ favourites });
};
export const getUserVotes: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastVoteId } = request.query as UserVotesQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const votes = await findVotesByUserId(userInfo.userId, lastVoteId);
	reply.status(200).send({ votes });
};
export const getUserBookmarks: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastBookmarkId } = request.query as UserBookmarksQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const bookmarks = await findBookmarksByUserId(userInfo.userId, lastBookmarkId);
	reply.status(200).send({ bookmarks });
};
export const getUserFollowing: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastFollowId } = request.query as UserFollowsQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const following = await findFollowingByUserId(userInfo.userId, lastFollowId);
	reply.status(200).send({ following });
};
export const getUserFollowers: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastFollowId } = request.query as UserFollowsQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const followers = await findFollowersByUserId(userInfo.userId, lastFollowId);
	reply.status(200).send({ followers });
};
export const getUserFollowRequestsSent: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastFollowRequestId } = request.query as UserFollowRequestsQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const followRequests = await findFollowRequestsSentByUserId(userInfo.userId, lastFollowRequestId);
	reply.status(200).send({ followRequests });
};
export const getUserFollowRequestsReceived: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastFollowRequestId } = request.query as UserFollowRequestsQueryString;
	const userInfo = request.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		reply.status(401).send();
		return;
	}
	const followRequests = await findFollowRequestsReceivedByUserId(userInfo.userId, lastFollowRequestId);
	reply.status(200).send({ followRequests });
};
export const getUserMentions: RouteHandlerMethod = async (request, reply) => {
	const { handle } = request.params as UserInteractParams;
	const { lastMentionId } = request.query as UserMentionsQueryString;
	const user = await findActiveUserByHandle(handle);
	if (!user) {
		reply.status(404).send("User not found");
		return;
	}
	const mentions = await findMentionsByUserId(user._id, (request.userInfo as UserInfo)?.userId, lastMentionId);
	reply.status(200).send({ mentions });
};
export const getLists: RouteHandlerMethod = async (request, reply) => {
	const { memberHandle, lastListId } = request.query as ListsQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const member = await findUserByHandle(memberHandle as string);
	if (memberHandle && !member) {
		reply.status(404).send("User not found");
		return;
	}
	const lists = await findListsByUserId(userId, member?._id, lastListId);
	reply.status(200).send({ lists });
};
export const getListMembers: RouteHandlerMethod = async (request, reply) => {
	const { name } = request.params as ListInteractParams;
	const { lastMemberId } = request.query as ListMembersQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		reply.status(404).send("List not found");
		return;
	}
	const members = await findMembersByListId(list._id, lastMemberId);
	reply.status(200).send({ members });
};
export const getBlocks: RouteHandlerMethod = async (request, reply) => {
	const { lastBlockId } = request.query as BlockedUsersQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const blockedUsers = await findBlocksByUserId(userId, lastBlockId);
	reply.status(200).send({ blockedUsers });
};
export const getMutedUsers: RouteHandlerMethod = async (request, reply) => {
	const { lastMuteId } = request.query as MutedItemsQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const mutedUsers = await findMutedUsersByUserId(userId, lastMuteId);
	reply.status(200).send({ mutedUsers });
};
export const getMutedPosts: RouteHandlerMethod = async (request, reply) => {
	const { lastMuteId } = request.query as MutedItemsQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const mutedPosts = await findMutedPostsByUserId(userId, lastMuteId);
	reply.status(200).send({ mutedPosts });
};
export const getMutedWords: RouteHandlerMethod = async (request, reply) => {
	const { lastMuteId } = request.query as MutedItemsQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const mutedWords = await findMutedWordsByUserId(userId, lastMuteId);
	for (const mute of mutedWords) {
		mute.word = mute.word.replace(/\\(.)/g, "$1");
	}
	reply.status(200).send({ mutedWords });
};
export const pinPost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	if (post.author.toString() !== userId) {
		reply.status(403).send("User can pin only their own post");
		return;
	}
	const pinned = await User.findByIdAndUpdate(userId, { pinnedPost: post._id }, { new: true });
	reply.status(200).send({ pinned });
};
export const unpinPost: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	const unpinned = await User.findByIdAndUpdate(userId, { pinnedPost: undefined }, { new: true });
	reply.status(200).send({ unpinned });
};
export const updateEmail: RouteHandlerMethod = async (request, reply) => {
	const { email: newEmail } = request.body as UpdateEmailBody;
	const { handle, userId } = request.userInfo as UserInfo;
	const { email: currentEmail } = (await User.findById(userId, { email: 1 })) as HydratedDocument<UserModel>;
	const emailVerification = await new EmailVerification({
		user: userId,
		email: newEmail,
		previousEmail: currentEmail,
		token: new ObjectId()
	}).save();
	reply.status(200).send({ emailVerification });
	if (currentEmail) {
		emailController.sendEmail(noReplyEmail, currentEmail, "Email address changed", emailTemplates.actions.rejectEmail(handle, currentEmail, `${process.env.ALLOW_ORIGIN}/reject-email/${emailVerification.token}`));
	}
	emailController.sendEmail(noReplyEmail, newEmail, "Verify email address", emailTemplates.actions.verifyEmail(handle, newEmail, `${process.env.ALLOW_ORIGIN}/verify-email/${emailVerification.token}`));
};
export const changePassword: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	const { oldPassword, newPassword } = request.body as ChangePasswordBody;
	const user = (await User.findById(userId).select("+password +email")) as HydratedDocument<UserModel>;
	const email = user.email;
	const authStatus = await bcrypt.compare(oldPassword, user.password);
	if (!authStatus) {
		reply.status(403).send("Current password is incorrect");
		return;
	}
	if (!(newPassword && passwordRegExp.test(newPassword))) {
		reply.status(400).send("New password is invalid");
		return;
	}
	const passwordHash = await bcrypt.hash(newPassword, rounds);
	await User.findByIdAndUpdate(user._id, { password: passwordHash });
	reply.status(200).send();
	if (email) {
		emailController.sendEmail(noReplyEmail, email, "Password changed", emailTemplates.notifications.passwordChanged(user.handle));
	}
};
export const deactivateUser: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const deactivated = (await User.findByIdAndUpdate(userId, { deactivated: true }, { new: true }).select("+email").session(session)) as HydratedDocument<UserModel>;
			const email = deactivated.email;
			await RefreshToken.deleteMany({ user: userId }).session(session);
			reply.status(200).send({ deactivated });
			if (email) {
				emailController.sendEmail(noReplyEmail, email, "Account deactivated", emailTemplates.notifications.deactivated(deactivated.handle));
			}
		});
	} finally {
		await session.endSession();
	}
};
export const activateUser: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	const activated = (await User.findByIdAndUpdate(
		userId,
		{
			deactivated: false
		},
		{
			new: true
		}
	).select("+email")) as HydratedDocument<UserModel>;
	const email = activated.email;
	reply.status(200).send({ activated });
	if (email) {
		emailController.sendEmail(noReplyEmail, email, "Account activated", emailTemplates.notifications.activated(activated.handle));
	}
};
export const deleteUser: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const userFilter = { user: userId };
			const ownerFilter = { owner: userId };
			const mutedByFilter = { mutedBy: userId };
			const deleted = (await User.findByIdAndUpdate(userId, { deleted: true }, { new: true }).select("+email").session(session)) as HydratedDocument<UserModel>;
			const email = deleted.email;
			await Promise.all([
				Favourite.deleteMany({ favouritedBy: userId }).session(session),
				Vote.deleteMany(userFilter).session(session),
				Bookmark.deleteMany({ bookmarkedBy: userId }).session(session),
				Follow.deleteMany({
					$or: [userFilter, { followedBy: userId }]
				}).session(session),
				FollowRequest.deleteMany({
					$or: [userFilter, { favouritedBy: userId }]
				}).session(session),
				List.deleteMany(ownerFilter).session(session),
				ListMember.deleteMany({
					$or: [userFilter, { list: await List.find(ownerFilter, { _id: 1 }) }]
				}).session(session),
				Block.deleteMany({
					$or: [userFilter, { blockedBy: userId }]
				}).session(session),
				MutedPost.deleteMany(mutedByFilter).session(session),
				MutedUser.deleteMany({
					$or: [userFilter, mutedByFilter]
				}).session(session),
				MutedWord.deleteMany(mutedByFilter).session(session),
				EmailVerification.deleteMany(userFilter).session(session),
				RefreshToken.deleteMany(userFilter).session(session),
				PasswordReset.deleteMany(userFilter).session(session),
				Settings.deleteMany(userFilter).session(session)
			]);
			reply.status(200).send({ deleted });
			if (email) {
				emailController.sendEmail(noReplyEmail, email, `Goodbye, ${deleted.handle}`, emailTemplates.notifications.activated(deleted.handle));
			}
		});
	} finally {
		await session.endSession();
	}
};