"use strict";

import fastify, { FastifyRequest, FastifySchema } from "fastify";
import { File } from "fastify-multer/lib/interfaces";
import { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
	interface FastifyRequest {
		userInfo?: string | JwtPayload | UserInfo;
		file?: File;
		fileType?: string;
		fileSubtype?: string;
	}
	interface FastifySchema {
		hide?: readonly boolean;
		tags?: readonly string[];
		consumes?: readonly string[];
		produces?: readonly string[];
	}
}