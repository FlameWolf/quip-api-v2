"use strict";

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import requireAuthentication from "../hooks/require-authentication";
import { blockUserSchema, userBookmarksSchema, userFavouritesSchema, userFollowsSchema, userMentionsSchema, userPostsSchema, userTopmostSchema, userVotesSchema, userInteractSchema } from "../requestDefinitions/users.requests";
import * as usersController from "../controllers/users.controller";
import * as followsController from "../controllers/follows.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as blocksController from "../controllers/blocks.controller";

const usersRouter = async (instance: FastifyInstance, options: FastifyPluginOptions) => {
	instance.get("/follow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.followUser);
	instance.get("/cancel-req/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followRequestsController.cancelFollowRequest);
	instance.get("/unfollow/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, followsController.unfollowUser);
	instance.get("/mute/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, mutesController.muteUser);
	instance.get("/unmute/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, mutesController.unmuteUser);
	instance.get("/block/:handle", { onRequest: requireAuthentication, schema: blockUserSchema }, blocksController.blockUser);
	instance.get("/unblock/:handle", { onRequest: requireAuthentication, schema: userInteractSchema }, blocksController.unblockUser);
	instance.get("/:handle", { schema: userInteractSchema }, usersController.getUser);
	instance.get("/:handle/posts", { schema: userPostsSchema }, usersController.getUserPosts);
	instance.get("/:handle/topmost/:period?", { schema: userTopmostSchema }, usersController.getUserTopmost);
	instance.get("/:handle/favourites", { onRequest: requireAuthentication, schema: userFavouritesSchema }, usersController.getUserFavourites);
	instance.get("/:handle/votes", { onRequest: requireAuthentication, schema: userVotesSchema }, usersController.getUserVotes);
	instance.get("/:handle/bookmarks", { onRequest: requireAuthentication, schema: userBookmarksSchema }, usersController.getUserBookmarks);
	instance.get("/:handle/following", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowing);
	instance.get("/:handle/followers", { onRequest: requireAuthentication, schema: userFollowsSchema }, usersController.getUserFollowers);
	instance.get("/:handle/mentions", { schema: userMentionsSchema }, usersController.getUserMentions);
};

export default usersRouter;