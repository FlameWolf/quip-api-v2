"use strict";

import { ObjectId } from "bson";
import mongoose, { FilterQuery } from "mongoose";
import * as bcrypt from "bcrypt";
import { noReplyEmail, emailTemplates, passwordRegExp, rounds } from "../library";
import timelineAggregationPipeline from "../db/pipelines/timeline";
import activityAggregationPipeline from "../db/pipelines/activity";
import topmostAggregationPipeline from "../db/pipelines/topmost";
import hashtagAggregationPipeline from "../db/pipelines/hashtag";
import * as emailController from "./email.controller";
import User from "../models/user.model";
import Post from "../models/post.model";
import EmailVerification from "../models/email-verification.model";
import PasswordReset from "../models/password-reset.model";
import { RouteHandlerMethod, FastifyRequest, FastifyReply } from "fastify";
import { ActivityParams, ActivityQueryString, EmailApprovalParams, ForgotPasswordBody, HashtagParams, HashtagQueryString, ResetPasswordBody, ResetPasswordParams, TimelineQueryString, TopmostParams, TopmostQueryString } from "../requestDefinitions/index.requests";

export const timeline: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { includeRepeats, includeReplies, lastPostId } = request.query as TimelineQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const posts = await User.aggregate(timelineAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
	reply.status(200).send({ posts });
};
export const activity: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { period } = request.params as ActivityParams;
	const { lastEntryId } = request.query as ActivityQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const entries = await User.aggregate(activityAggregationPipeline(userId, period, lastEntryId));
	reply.status(200).send({ entries });
};
export const topmost: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { period } = request.params as TopmostParams;
	const { lastScore, lastPostId } = request.query as TopmostQueryString;
	const posts = await Post.aggregate(topmostAggregationPipeline((request.userInfo as UserInfo)?.userId, period, lastScore, lastPostId));
	reply.status(200).send({ posts });
};
export const hashtag: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { name: tagName } = request.params as HashtagParams;
	const { sortBy, lastScore, lastPostId } = request.query as HashtagQueryString;
	const posts = await Post.aggregate(hashtagAggregationPipeline(tagName, (request.userInfo as UserInfo)?.userId, sortBy, lastScore, lastPostId));
	reply.status(200).send({ posts });
};
export const rejectEmail: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { token } = request.params as EmailApprovalParams;
	const session = await mongoose.startSession();
	try {
		const emailVerification = await EmailVerification.findOne({ token });
		if (!emailVerification) {
			reply.status(404).send("Verification token not found or expired");
			return;
		}
		await session.withTransaction(async () => {
			const previousEmail = emailVerification.previousEmail;
			const user = await User.findByIdAndUpdate(emailVerification.user, { email: emailVerification.previousEmail }).session(session);
			await EmailVerification.deleteOne(emailVerification?.toJSON() as FilterQuery<any>).session(session);
			reply.status(200).send();
			if (previousEmail) {
				emailController.sendEmail(noReplyEmail, previousEmail, "Email address change rejected", emailTemplates.notifications.emailRejected(user?.handle as string, emailVerification.email as string));
			}
		});
	} finally {
		await session.endSession();
	}
};
export const verifyEmail: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { token } = request.params as EmailApprovalParams;
	const emailVerification = await EmailVerification.findOne({ token });
	if (!emailVerification) {
		reply.status(404).send("Verification token not found or expired");
		return;
	}
	const email = emailVerification.email as string;
	const user = await User.findByIdAndUpdate(emailVerification.user, { email });
	reply.status(200).send();
	emailController.sendEmail(noReplyEmail, email, "Email address change verified", emailTemplates.notifications.emailVerified(user?.handle as string, email));
};
export const forgotPassword: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { handle, email } = request.body as ForgotPasswordBody;
	const user = await User.findOne({ handle, deleted: false }).select("+email");
	if (!user) {
		reply.status(400).send("User not found");
		return;
	}
	if (user.email !== email) {
		reply.status(403).send("Email address is incorrect or unverified");
		return;
	}
	const passwordReset = await new PasswordReset({
		user: user._id,
		token: new ObjectId()
	}).save();
	reply.status(200).send({ passwordReset });
	emailController.sendEmail(noReplyEmail, email, "Reset password", emailTemplates.actions.resetPassword(handle, `${process.env.ALLOW_ORIGIN}/reset-password/${passwordReset.token}`));
};
export const resetPassword: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
	const { token } = request.params as ResetPasswordParams;
	const { password } = request.body as ResetPasswordBody;
	const session = await mongoose.startSession();
	try {
		const passwordReset = await PasswordReset.findOne({ token });
		if (!passwordReset) {
			reply.status(404).send("Reset token not found or expired");
			return;
		}
		if (!(password && passwordRegExp.test(password))) {
			reply.status(400).send("Invalid password");
			return;
		}
		await session.withTransaction(async () => {
			const passwordHash = await bcrypt.hash(password, rounds);
			const user = await User.findByIdAndUpdate(passwordReset.user, { password: passwordHash }).select("+email").session(session);
			await PasswordReset.deleteOne(passwordReset?.toJSON() as FilterQuery<any>).session(session);
			reply.status(200).send();
			emailController.sendEmail(noReplyEmail, user?.email as string, "Password reset", emailTemplates.notifications.passwordReset(user?.handle as string));
		});
	} finally {
		await session.endSession();
	}
};