"use strict";

import process = require("node:process");
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { invalidHandles, handleRegExp, passwordRegExp, rounds, authTokenLife } from "../library";
import User from "../models/user.model";
import RefreshToken from "../models/refresh-token.model";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthPayload, CredentialsBody, RefreshTokenBody, RefreshTokenHeaders, RevokeTokenParams } from "../requestDefinitions/auth.requests";

const generateAuthToken = (handle: string, userId: string) => {
	return jwt.sign({ handle, userId }, process.env.JWT_AUTH_SECRET as string, { expiresIn: authTokenLife });
};
const generateRefreshToken = (handle: string, userId: string) => {
	return jwt.sign({ handle, userId }, process.env.JWT_REFRESH_SECRET as string);
};
const validateHandle = (handle: string) => {
	return handle && invalidHandles.indexOf(handle.trim().toLowerCase()) === -1 && handleRegExp.test(handle);
};
const validatePassword = (password: string) => {
	return password && passwordRegExp.test(password);
};
const authSuccess = async (handle: string, userId: string, includeRefreshToken = true) => {
	const payload: AuthPayload = {
		userId,
		authToken: generateAuthToken(handle, userId),
		createdAt: Date.now(),
		expiresIn: authTokenLife
	};
	if (includeRefreshToken) {
		const refreshToken = generateRefreshToken(handle, userId);
		payload.refreshToken = refreshToken;
		await new RefreshToken({
			user: userId,
			token: refreshToken
		}).save();
	}
	return payload;
};
export const signUp = async (request: FastifyRequest, reply: FastifyReply) => {
	const { handle, password } = request.body as CredentialsBody;
	if (!(validateHandle(handle) && validatePassword(password))) {
		reply.status(400).send("Invalid username/password");
		return;
	}
	if (await User.countDocuments({ handle })) {
		reply.status(409).send("Username unavailable");
		return;
	}
	const passwordHash = await bcrypt.hash(password, rounds);
	const user = await new User({ handle, password: passwordHash }).save();
	const userId = user._id;
	reply.status(201).send(await authSuccess(handle, userId.toString()));
};
export const signIn = async (request: FastifyRequest, reply: FastifyReply) => {
	const { handle, password } = request.body as CredentialsBody;
	const user = await User.findOne({ handle }).select("+password");
	if (!user) {
		reply.status(404).send("User not found");
		return;
	}
	const authStatus = await bcrypt.compare(password, user.password);
	if (!authStatus) {
		reply.status(403).send("Invalid credentials");
		return;
	}
	const userId = user._id;
	reply.status(200).send(await authSuccess(handle, userId.toString()));
};
export const refreshAuthToken = async (request: FastifyRequest, reply: FastifyReply) => {
	const { refreshToken } = request.body as RefreshTokenBody;
	const { "x-slug": handle, "x-uid": userId } = request.headers as RefreshTokenHeaders;
	if (!refreshToken) {
		reply.status(400).send("Refresh token not found");
		return;
	}
	const userInfo = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as UserInfo;
	const filter = { user: userId, token: refreshToken };
	if (userInfo.handle !== handle || userInfo.userId !== userId) {
		reply.status(401).send("Refresh token invalid");
		return;
	}
	if (!(await RefreshToken.countDocuments(filter))) {
		reply.status(401).send("Refresh token revoked or expired");
		return;
	}
	await RefreshToken.findOneAndUpdate(filter, { lastUsed: new Date() });
	reply.status(200).send(await authSuccess(handle, userId, false));
};
export const revokeRefreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
	const { token: refreshToken } = request.params as RevokeTokenParams;
	if (!refreshToken) {
		reply.status(400).send("Refresh token not found");
		return;
	}
	const deleted = await RefreshToken.findOneAndDelete({ token: refreshToken });
	reply.status(deleted ? 200 : 404).send();
};