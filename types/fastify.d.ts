import fastify, { FastifyInstance, FastifyRequest, FastifySchema } from "fastify";
import { FastifyAuthFunction } from "@fastify/auth";
import { File } from "fastify-multer/lib/interfaces";
import { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
	interface FastifyInstance {
		authenticateRequest: FastifyAuthFunction;
		requireAuthentication: FastifyAuthFunction;
	}
	interface FastifyRequest {
		userInfo?: string | JwtPayload | UserInfo;
		file?: File;
		fileType?: string;
		fileSubtype?: string;
	}
	interface FastifySchema {
		consumes?: readonly string[];
	}
}