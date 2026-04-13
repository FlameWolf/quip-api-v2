"use strict";

import requireAuthentication from "../hooks/requireAuthentication.ts";
import { blockMuteUserSchema, userBookmarksSchema, userFavouritesSchema, userFollowsSchema, userMentionsSchema, userPostsSchema, userTopmostSchema, userVotesSchema, userInteractSchema } from "../requestDefinitions/users.requests.ts";
import * as usersController from "../controllers/users.controller.ts";
import * as followsController from "../controllers/follows.controller.ts";
import * as followRequestsController from "../controllers/follow-requests.controller.ts";
import * as mutesController from "../controllers/mutes.controller.ts";
import * as blocksController from "../controllers/blocks.controller.ts";
import type { FastifyPluginAsync } from "fastify";

const usersRouter: FastifyPluginAsync = async (instance, options) => {
	instance.get("/:handle", { schema: userInteractSchema }, usersController.getUser);
	instance.get("/:handle/posts", { schema: userPostsSchema }, usersController.getUserPosts);
	instance.get("/:handle/topmost/:period?", { schema: userTopmostSchema }, usersController.getUserTopmost);
	instance.get("/:handle/mentions", { schema: userMentionsSchema }, usersController.getUserMentions);
	instance.get("/follow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.followUser);
	instance.get("/cancel-req/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followRequestsController.cancelFollowRequest);
	instance.get("/unfollow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.unfollowUser);
	instance.get("/mute/:handle", { onRequest: requireAuthentication, schema: blockMuteUserSchema }, mutesController.muteUser);
	instance.get("/unmute/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, mutesController.unmuteUser);
	instance.get("/block/:handle", { onRequest: requireAuthentication, schema: blockMuteUserSchema }, blocksController.blockUser);
	instance.get("/unblock/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, blocksController.unblockUser);
	instance.get("/:handle/favourites", { onRequest: requireAuthentication, schema: userFavouritesSchema }, usersController.getUserFavourites);
	instance.get("/:handle/votes", { onRequest: requireAuthentication, schema: userVotesSchema }, usersController.getUserVotes);
	instance.get("/:handle/bookmarks", { onRequest: requireAuthentication, schema: userBookmarksSchema }, usersController.getUserBookmarks);
	instance.get("/:handle/following", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowing);
	instance.get("/:handle/followers", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowers);
};

export default usersRouter;