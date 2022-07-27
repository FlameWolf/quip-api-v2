"use strict";

import { onRequestAsyncHookHandler } from "fastify";

const requireAuthentication: onRequestAsyncHookHandler = async (request, reply) => {
	if (!request.userInfo) {
		reply.status(401).send();
	}
};

export default requireAuthentication;