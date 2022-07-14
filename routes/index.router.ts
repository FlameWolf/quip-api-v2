"use strict";

import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import * as indexController from "../controllers/index.controller";
import { activitySchema, emailApprovalSchema, forgotPasswordSchema, hashtagSchema, resetPasswordSchema, timelineSchema, topmostSchema } from "../requestDefinitions/index.requests";

const indexRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
		if (process.env.NODE_ENV !== "production") {
			reply.redirect("/swagger");
			return;
		}
		reply.status(404).send();
	});
	server.get("/timeline", { schema: timelineSchema, preHandler: server.auth([server.requireAuthentication]) }, indexController.timeline);
	server.get("/activity/:period?", { schema: activitySchema, preHandler: server.auth([server.requireAuthentication]) }, indexController.activity);
	server.get("/topmost/:period?", { schema: topmostSchema }, indexController.topmost);
	server.get("/hashtag/:name", { schema: hashtagSchema }, indexController.hashtag);
	server.get("/reject-email/:token", { schema: emailApprovalSchema }, indexController.rejectEmail);
	server.get("/verify-email/:token", { schema: emailApprovalSchema }, indexController.verifyEmail);
	server.post("/forgot-password", { schema: forgotPasswordSchema }, indexController.forgotPassword);
	server.post("/reset-password/:token", { schema: resetPasswordSchema }, indexController.resetPassword);
	done();
};

export default indexRouter;