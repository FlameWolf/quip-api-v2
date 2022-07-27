"use strict";

import { FastifyReply, FastifyRequest } from "fastify";

export const preValidatePostBody = async (request: FastifyRequest, reply: FastifyReply) => {
	const requestBody = request.body as Dictionary;
	const { poll, location } = requestBody;
	request.body = {
		...requestBody,
		poll: poll ? JSON.parse(poll) : undefined,
		location: location ? JSON.parse(location) : undefined
	};
};