"use strict";

import { credentialsSchema, refreshTokenSchema, revokeTokenSchema } from "../requestDefinitions/auth.requests.ts";
import * as authController from "../controllers/auth.controller.ts";
import type { FastifyPluginAsync } from "fastify";

const authRouter: FastifyPluginAsync = async (instance, options) => {
	instance.post("/sign-up", { schema: credentialsSchema }, authController.signUp);
	instance.post("/sign-in", { schema: credentialsSchema }, authController.signIn);
	instance.post("/refresh-token", { schema: refreshTokenSchema }, authController.refreshAuthToken);
	instance.get("/revoke-token/:token", { schema: revokeTokenSchema }, authController.revokeRefreshToken);
};

export default authRouter;