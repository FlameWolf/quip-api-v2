"use strict";

import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

const requireAuthentication = async (request: FastifyRequest, reply: FastifyReply) => {
	if (!request.userInfo) {
		reply.status(401).send();
	}
};

export default requireAuthentication;