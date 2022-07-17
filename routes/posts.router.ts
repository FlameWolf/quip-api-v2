"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import requireAuthentication from "../hooks/require-authentication";
import { preValidatePostBody } from "../hooks/postBodyPreValidation";
import { postCreateSchema, postInteractAndCreateSchema, postInteractSchema, postQuotesSchema, postRepliesSchema, postUpdateSchema, postVoteSchema } from "../requestDefinitions/posts.requests";
import * as postsController from "../controllers/posts.controller";
import * as favouritesController from "../controllers/favourites.controller";
import * as bookmarksController from "../controllers/bookmarks.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as multerController from "../controllers/multer.controller";

const postsRouter = (instance: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	instance.post("/create", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postCreateSchema }, postsController.createPost);
	instance.post("/update/:postId", { onRequest: requireAuthentication, schema: postUpdateSchema }, postsController.updatePost);
	instance.get("/favourite/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, favouritesController.addFavourite);
	instance.get("/unfavourite/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, favouritesController.removeFavourite);
	instance.get("/bookmark/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, bookmarksController.addBookmark);
	instance.get("/unbookmark/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, bookmarksController.removeBookmark);
	instance.post("/quote/:postId", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postInteractAndCreateSchema }, postsController.quotePost);
	instance.get("/repeat/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.repeatPost);
	instance.get("/unrepeat/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.unrepeatPost);
	instance.post("/reply/:postId", { onRequest: requireAuthentication, preValidation: [multerController.extractMediaFile, preValidatePostBody], schema: postInteractAndCreateSchema }, postsController.replyToPost);
	instance.get("/mute/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, mutesController.mutePost);
	instance.get("/unmute/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, mutesController.unmutePost);
	instance.get("/vote/:postId", { onRequest: requireAuthentication, schema: postVoteSchema }, postsController.castVote);
	instance.delete("/delete/:postId", { onRequest: requireAuthentication, schema: postInteractSchema }, postsController.deletePost);
	instance.get("/:postId", { schema: postInteractSchema }, postsController.getPost);
	instance.get("/:postId/quotes", { schema: postQuotesSchema }, postsController.getPostQuotes);
	instance.get("/:postId/replies", { schema: postRepliesSchema }, postsController.getPostReplies);
	instance.get("/:postId/parent", { schema: postInteractSchema }, postsController.getPostParent);
	done();
};

export default postsRouter;