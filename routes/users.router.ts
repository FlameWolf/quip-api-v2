"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import * as usersController from "../controllers/users.controller";
import * as followsController from "../controllers/follows.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as blocksController from "../controllers/blocks.controller";
import { blockUserSchema, userBookmarksSchema, userFavouritesSchema, userFollowsSchema, userMentionsSchema, userPostsSchema, userTopmostSchema, userVotesSchema, userInteractSchema } from "../requestDefinitions/users.requests";

const usersRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.get("/follow/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, followsController.followUser);
	server.get("/cancel-req/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, followRequestsController.cancelFollowRequest);
	server.get("/unfollow/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, followsController.unfollowUser);
	server.get("/mute/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, mutesController.muteUser);
	server.get("/unmute/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, mutesController.unmuteUser);
	server.get("/block/:handle", { schema: blockUserSchema, preHandler: server.auth([server.requireAuthentication]) }, blocksController.blockUser);
	server.get("/unblock/:handle", { schema: userInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, blocksController.unblockUser);
	server.get("/:handle", { schema: userInteractSchema }, usersController.getUser);
	server.get("/:handle/posts", { schema: userPostsSchema }, usersController.getUserPosts);
	server.get("/:handle/topmost/:period?", { schema: userTopmostSchema }, usersController.getUserTopmost);
	server.get("/:handle/favourites", { schema: userFavouritesSchema, preHandler: server.auth([server.requireAuthentication]) }, usersController.getUserFavourites);
	server.get("/:handle/votes", { schema: userVotesSchema, preHandler: server.auth([server.requireAuthentication]) }, usersController.getUserVotes);
	server.get("/:handle/bookmarks", { schema: userBookmarksSchema, preHandler: server.auth([server.requireAuthentication]) }, usersController.getUserBookmarks);
	server.get("/:handle/following", { schema: userFollowsSchema, preHandler: server.auth([server.requireAuthentication]) }, usersController.getUserFollowing);
	server.get("/:handle/followers", { schema: userFollowsSchema, preHandler: server.auth([server.requireAuthentication]) }, usersController.getUserFollowers);
	server.get("/:handle/mentions", { schema: userMentionsSchema }, usersController.getUserMentions);
	done();
};

export default usersRouter;