"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import * as settingsController from "../controllers/settings.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as usersController from "../controllers/users.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";
import { wordMuteSchema, settingsSchema, requestApprovalSchema, followRequestsSchema, blockedUsersSchema, mutedItemsSchema, updateEmailSchema, updateSettingSchema, getSettingSchema } from "../requestDefinitions/settings.requests";
import { postInteractSchema } from "../requestDefinitions/posts.requests";

const settingsRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.addHook("onRequest", server.auth([server.requireAuthentication]));
	server.post("/", { schema: settingsSchema }, settingsController.updateSettings);
	server.get("/", settingsController.getSettings);
	server.post("/mute", { schema: wordMuteSchema }, mutesController.muteWord);
	server.post("/unmute", { schema: wordMuteSchema }, mutesController.unmuteWord);
	server.post("/sent-reqs", usersController.getUserFollowRequestsSent);
	server.post("/received-reqs", usersController.getUserFollowRequestsReceived);
	server.get("/accept-req/:requestId", { schema: requestApprovalSchema }, followRequestsController.acceptFollowRequest);
	server.post("/accept-reqs", { schema: followRequestsSchema }, followRequestsController.acceptSelectedFollowRequests);
	server.get("/accept-all-reqs", followRequestsController.acceptAllFollowRequests);
	server.get("/reject-req/:requestId", { schema: requestApprovalSchema }, followRequestsController.rejectFollowRequest);
	server.post("/reject-reqs", { schema: followRequestsSchema }, followRequestsController.rejectSelectedFollowRequests);
	server.get("/reject-all-reqs", followRequestsController.rejectAllFollowRequests);
	server.get("/blocked", { schema: blockedUsersSchema }, usersController.getBlocks);
	server.get("/muted/users", { schema: mutedItemsSchema }, usersController.getMutedUsers);
	server.get("/muted/posts", { schema: mutedItemsSchema }, usersController.getMutedPosts);
	server.get("/muted/words", { schema: mutedItemsSchema }, usersController.getMutedWords);
	server.get("/pin/{postId}", { schema: postInteractSchema }, usersController.pinPost);
	server.get("/unpin", usersController.unpinPost);
	server.post("/update-email", { schema: updateEmailSchema }, usersController.updateEmail);
	server.post("/change-password", usersController.changePassword);
	server.get("/deactivate", usersController.deactivateUser);
	server.get("/activate", usersController.activateUser);
	server.delete("/delete", usersController.deleteUser);
	server.put("/:path", { schema: updateSettingSchema }, settingsController.updateSettingByPath);
	server.get("/:path", { schema: getSettingSchema }, settingsController.getSettingByPath);
	done();
};

export default settingsRouter;