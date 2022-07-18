import fastify, { FastifyInstance, FastifyRequest, FastifySchema, onRequestHookHandler } from "fastify";
import { File } from "fastify-multer/lib/interfaces";
import { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
	interface FastifyInstance {
		authenticateRequest: onRequestHookHandler;
		requireAuthentication: onRequestHookHandler;
	}
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