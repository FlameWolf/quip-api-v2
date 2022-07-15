"use strict";

import * as jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

export const authenticateRequest = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
	try {
		const authToken = request.headers.authorization?.replace(/^bearer\s+/i, "");
		request.userInfo = authToken && (jwt.verify(authToken, process.env.JWT_AUTH_SECRET as string) as UserInfo);
	} catch (err) {}
	done();
};

export const requireAuthentication = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
	if (!request.userInfo) {
		reply.status(401).send();
		return;
	}
	done();
};