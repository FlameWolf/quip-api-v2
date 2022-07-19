"use strict";

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import requireAuthentication from "../hooks/require-authentication";
import { activitySchema, emailApprovalSchema, forgotPasswordSchema, hashtagSchema, resetPasswordSchema, timelineSchema, topmostSchema } from "../requestDefinitions/index.requests";
import * as indexController from "../controllers/index.controller";

const indexRouter = async (instance: FastifyInstance, options: FastifyPluginOptions) => {
	instance.get(
		"/",
		{
			schema: {
				hide: true
			}
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (process.env.NODE_ENV !== "production") {
				reply.redirect("/swagger");
				return;
			}
			reply.status(404).send();
		}
	);
	instance.get("/timeline", { onRequest: requireAuthentication, schema: timelineSchema }, indexController.timeline);
	instance.get("/activity/:period?", { onRequest: requireAuthentication, schema: activitySchema }, indexController.activity);
	instance.get("/topmost/:period?", { schema: topmostSchema }, indexController.topmost);
	instance.get("/hashtag/:name", { schema: hashtagSchema }, indexController.hashtag);
	instance.get("/reject-email/:token", { schema: emailApprovalSchema }, indexController.rejectEmail);
	instance.get("/verify-email/:token", { schema: emailApprovalSchema }, indexController.verifyEmail);
	instance.post("/forgot-password", { schema: forgotPasswordSchema }, indexController.forgotPassword);
	instance.post("/reset-password/:token", { schema: resetPasswordSchema }, indexController.resetPassword);
};

export default indexRouter;