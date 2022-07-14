"use strict";

import { FastifyReply, FastifyRequest, HookHandlerDoneFunction, RequestPayload } from "fastify";

export const validatePostBody = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
	const requestBody = request.body as Dictionary;
	const { poll, location } = requestBody;
	request.body = {
		...requestBody,
		...(poll && { poll: JSON.parse(poll) }),
		...(location && { location: JSON.parse(location) })
	};
	done();
};