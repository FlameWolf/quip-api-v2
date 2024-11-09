"use strict";

import fastify, { FastifyRequest, FastifySchema } from "fastify";
import { File as FormzillaFile } from "formzilla";
import { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
	interface FastifyRequest {
		userInfo?: string | JwtPayload | UserInfo;
	}
	interface FastifySchema {
		hide?: readonly boolean;
		tags?: readonly string[];
		consumes?: readonly string[];
		produces?: readonly string[];
	}
}