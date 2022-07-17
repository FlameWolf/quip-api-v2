"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import requireAuthentication from "../hooks/require-authentication";
import { blockUserSchema, userBookmarksSchema, userFavouritesSchema, userFollowsSchema, userMentionsSchema, userPostsSchema, userTopmostSchema, userVotesSchema, userInteractSchema } from "../requestDefinitions/users.requests";
import * as usersController from "../controllers/users.controller";
import * as followsController from "../controllers/follows.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as blocksController from "../controllers/blocks.controller";

const usersRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.get("/follow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.followUser);
	server.get("/cancel-req/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followRequestsController.cancelFollowRequest);
	server.get("/unfollow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.unfollowUser);
	server.get("/mute/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, mutesController.muteUser);
	server.get("/unmute/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, mutesController.unmuteUser);
	server.get("/block/:handle", { onRequest: requireAuthentication, schema: blockUserSchema }, blocksController.blockUser);
	server.get("/unblock/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, blocksController.unblockUser);
	server.get("/:handle", { schema: userInteractSchema }, usersController.getUser);
	server.get("/:handle/posts", { schema: userPostsSchema }, usersController.getUserPosts);
	server.get("/:handle/topmost/:period?", { schema: userTopmostSchema }, usersController.getUserTopmost);
	server.get("/:handle/favourites", { onRequest: requireAuthentication, schema: userFavouritesSchema }, usersController.getUserFavourites);
	server.get("/:handle/votes", { onRequest: requireAuthentication, schema: userVotesSchema }, usersController.getUserVotes);
	server.get("/:handle/bookmarks", { onRequest: requireAuthentication, schema: userBookmarksSchema }, usersController.getUserBookmarks);
	server.get("/:handle/following", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowing);
	server.get("/:handle/followers", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowers);
	server.get("/:handle/mentions", { schema: userMentionsSchema }, usersController.getUserMentions);
	done();
};

export default usersRouter;