"use strict";

import { preValidationAsyncHookHandler } from "fastify";

const updateFileInfo: preValidationAsyncHookHandler = async (request, reply) => {
	const files = request.__files__;
	if (files) {
		for (const file of files) {
			[file.type, file.subType] = file.mimeType.split("/");
		}
	}
};

export default updateFileInfo;