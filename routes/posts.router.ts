"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import * as postsController from "../controllers/posts.controller";
import * as favouritesController from "../controllers/favourites.controller";
import * as bookmarksController from "../controllers/bookmarks.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as multerController from "../controllers/multer.controller";
import { postCreateSchema, postInteractAndCreateSchema, postInteractSchema, postQuotesSchema, postRepliesSchema, postUpdateSchema, postVoteSchema } from "../requestDefinitions/posts.requests";

const postsRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.post("/create", { schema: postCreateSchema, preHandler: server.auth([server.requireAuthentication]), preValidation: multerController.uploadMediaFileToCloud }, postsController.createPost);
	server.post("/update/:postId", { schema: postUpdateSchema, preHandler: server.auth([server.requireAuthentication]) }, postsController.updatePost);
	server.get("/favourite/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, favouritesController.addFavourite);
	server.get("/unfavourite/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, favouritesController.removeFavourite);
	server.get("/bookmark/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, bookmarksController.addBookmark);
	server.get("/unbookmark/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, bookmarksController.removeBookmark);
	server.post("/quote/:postId", { schema: postInteractAndCreateSchema, preHandler: server.auth([server.requireAuthentication]), preValidation: multerController.uploadMediaFileToCloud }, postsController.quotePost);
	server.get("/repeat/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, postsController.repeatPost);
	server.get("/unrepeat/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, postsController.unrepeatPost);
	server.post("/reply/:postId", { schema: postInteractAndCreateSchema, preHandler: server.auth([server.requireAuthentication]), preValidation: multerController.uploadMediaFileToCloud }, postsController.replyToPost);
	server.get("/mute/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, mutesController.mutePost);
	server.get("/unmute/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, mutesController.unmutePost);
	server.get("/vote/:postId", { schema: postVoteSchema, preHandler: server.auth([server.requireAuthentication]) }, postsController.castVote);
	server.delete("/delete/:postId", { schema: postInteractSchema, preHandler: server.auth([server.requireAuthentication]) }, postsController.deletePost);
	server.get("/:postId", { schema: postInteractSchema }, postsController.getPost);
	server.get("/:postId/quotes", { schema: postQuotesSchema }, postsController.getPostQuotes);
	server.get("/:postId/replies", { schema: postRepliesSchema }, postsController.getPostReplies);
	server.get("/:postId/parent", { schema: postInteractSchema }, postsController.getPostParent);
	done();
};

export default postsRouter;