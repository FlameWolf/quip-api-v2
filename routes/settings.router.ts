"use strict";

import { FastifyPluginAsync } from "fastify";
import requireAuthentication from "../hooks/requireAuthentication";
import { wordMuteSchema, settingsSchema, requestApprovalSchema, followRequestsSchema, blockedUsersSchema, mutedItemsSchema, updateEmailSchema, updateSettingSchema, getSettingSchema } from "../requestDefinitions/settings.requests";
import { postInteractSchema } from "../requestDefinitions/posts.requests";
import * as settingsController from "../controllers/settings.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as usersController from "../controllers/users.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";

const settingsRouter: FastifyPluginAsync = async (instance, options) => {
	instance.addHook("onRequest", requireAuthentication);
	instance.post("/", { schema: settingsSchema }, settingsController.updateSettings);
	instance.get("/", settingsController.getSettings);
	instance.post("/mute", { schema: wordMuteSchema }, mutesController.muteWord);
	instance.post("/unmute", { schema: wordMuteSchema }, mutesController.unmuteWord);
	instance.post("/sent-reqs", usersController.getUserFollowRequestsSent);
	instance.post("/received-reqs", usersController.getUserFollowRequestsReceived);
	instance.get("/accept-req/:requestId", { schema: requestApprovalSchema }, followRequestsController.acceptFollowRequest);
	instance.post("/accept-reqs", { schema: followRequestsSchema }, followRequestsController.acceptSelectedFollowRequests);
	instance.get("/accept-all-reqs", followRequestsController.acceptAllFollowRequests);
	instance.get("/reject-req/:requestId", { schema: requestApprovalSchema }, followRequestsController.rejectFollowRequest);
	instance.post("/reject-reqs", { schema: followRequestsSchema }, followRequestsController.rejectSelectedFollowRequests);
	instance.get("/reject-all-reqs", followRequestsController.rejectAllFollowRequests);
	instance.get("/blocked", { schema: blockedUsersSchema }, usersController.getBlocks);
	instance.get("/muted/users", { schema: mutedItemsSchema }, usersController.getMutedUsers);
	instance.get("/muted/posts", { schema: mutedItemsSchema }, usersController.getMutedPosts);
	instance.get("/muted/words", { schema: mutedItemsSchema }, usersController.getMutedWords);
	instance.get("/pin/{postId}", { schema: postInteractSchema }, usersController.pinPost);
	instance.get("/unpin", usersController.unpinPost);
	instance.post("/update-email", { schema: updateEmailSchema }, usersController.updateEmail);
	instance.post("/change-password", usersController.changePassword);
	instance.get("/deactivate", usersController.deactivateUser);
	instance.get("/activate", usersController.activateUser);
	instance.delete("/delete", usersController.deleteUser);
	instance.put("/:path", { schema: updateSettingSchema }, settingsController.updateSettingByPath);
	instance.get("/:path", { schema: getSettingSchema }, settingsController.getSettingByPath);
};

export default settingsRouter;