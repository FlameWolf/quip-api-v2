"use strict";

import { FastifyRequest, FastifyReply } from "fastify";

const requireAuthentication = async (request: FastifyRequest, reply: FastifyReply) => {
	if (!request.userInfo) {
		reply.status(401).send();
	}
};

export default requireAuthentication;