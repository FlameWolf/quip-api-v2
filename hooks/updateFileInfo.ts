"use strict";

import { preValidationAsyncHookHandler } from "fastify";
import * as path from "path";

const updateFileInfo: preValidationAsyncHookHandler = async (request, reply) => {
	const files = request.__files__;
	if (files) {
		for (const file of files) {
			[file.type, file.subType] = file.mimeType.split("/");
			file.bareName = path.basename(file.path as string, `.${file.subType}`);
		}
	}
};

export default updateFileInfo;