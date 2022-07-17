"use strict";

import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

const requireAuthentication = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
	if (!request.userInfo) {
		reply.status(401).send();
		return;
	}
	done();
};

export default requireAuthentication;