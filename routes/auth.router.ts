"use strict";

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { credentialsSchema, refreshTokenSchema, revokeTokenSchema } from "../requestDefinitions/auth.requests";
import * as authController from "../controllers/auth.controller";

const authRouter = async (instance: FastifyInstance, options: FastifyPluginOptions) => {
	instance.post("/sign-up", { schema: credentialsSchema }, authController.signUp);
	instance.post("/sign-in", { schema: credentialsSchema }, authController.signIn);
	instance.post("/refresh-token", { schema: refreshTokenSchema }, authController.refreshAuthToken);
	instance.get("/revoke-token/:token", { schema: revokeTokenSchema }, authController.revokeRefreshToken);
};

export default authRouter;