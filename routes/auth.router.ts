"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import * as authController from "../controllers/auth.controller";
import { credentialsSchema, refreshTokenSchema, revokeTokenSchema } from "../requestDefinitions/auth.requests";

const authRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.post("/sign-up", { schema: credentialsSchema }, authController.signUp);
	server.post("/sign-in", { schema: credentialsSchema }, authController.signIn);
	server.post("/refresh-token", { schema: refreshTokenSchema }, authController.refreshAuthToken);
	server.get("/revoke-token/:token", { schema: revokeTokenSchema }, authController.revokeRefreshToken);
	done();
};

export default authRouter;