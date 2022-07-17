"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import { requireAuthentication } from "../hooks/authentication";
import { preValidatePostBody } from "../hooks/postBodyPreValidation";
import { postCreateSchema, postInteractAndCreateSchema, postInteractSchema, postQuotesSchema, postRepliesSchema, postUpdateSchema, postVoteSchema } from "../requestDefinitions/posts.requests";
import * as postsController from "../controllers/posts.controller";
import * as favouritesController from "../controllers/favourites.controller";
import * as bookmarksController from "../controllers/bookmarks.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as multerController from "../controllers/multer.controller";

const postsRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.post("/create", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postCreateSchema }, postsController.createPost);
	server.post("/update/:postId", { onRequest: requireAuthentication, schema: postUpdateSchema }, postsController.updatePost);
	server.get("/favourite/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, favouritesController.addFavourite);
	server.get("/unfavourite/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, favouritesController.removeFavourite);
	server.get("/bookmark/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, bookmarksController.addBookmark);
	server.get("/unbookmark/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, bookmarksController.removeBookmark);
	server.post("/quote/:postId", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postInteractAndCreateSchema }, postsController.quotePost);
	server.get("/repeat/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.repeatPost);
	server.get("/unrepeat/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.unrepeatPost);
	server.post("/reply/:postId", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postInteractAndCreateSchema }, postsController.replyToPost);
	server.get("/mute/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, mutesController.mutePost);
	server.get("/unmute/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, mutesController.unmutePost);
	server.get("/vote/:postId", { onRequest: requireAuthentication, schema: postVoteSchema }, postsController.castVote);
	server.delete("/delete/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.deletePost);
	server.get("/:postId", { schema: postInteractSchema }, postsController.getPost);
	server.get("/:postId/quotes", { schema: postQuotesSchema }, postsController.getPostQuotes);
	server.get("/:postId/replies", { schema: postRepliesSchema }, postsController.getPostReplies);
	server.get("/:postId/parent", { schema: postInteractSchema }, postsController.getPostParent);
	done();
};

export default postsRouter;