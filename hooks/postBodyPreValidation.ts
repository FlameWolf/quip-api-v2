"use strict";

import { preValidationAsyncHookHandler } from "fastify";

const preValidatePostBody: preValidationAsyncHookHandler = async (request, reply) => {
	const requestBody = request.body as Dictionary;
	const { poll, location } = requestBody;
	request.body = {
		...requestBody,
		poll: poll ? JSON.parse(poll) : undefined,
		location: location ? JSON.parse(location) : undefined
	};
};

export default preValidatePostBody;