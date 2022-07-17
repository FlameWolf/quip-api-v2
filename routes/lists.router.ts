"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import { requireAuthentication } from "../hooks/authentication";
import { listsSchema, listMemberSchema, listInteractSchema, listCreateSchema, listUpdateSchema, listMembersSchema, listPostsSchema } from "../requestDefinitions/lists.requests";
import * as userController from "../controllers/users.controller";
import * as listsController from "../controllers/lists.controller";

const listsRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.addHook("onRequest", requireAuthentication);
	server.get("/", { schema: listsSchema }, userController.getLists);
	server.post("/create", { schema: listCreateSchema }, listsController.createList);
	server.post("/update", { schema: listUpdateSchema }, listsController.updateList);
	server.post("/add-member", { schema: listMemberSchema }, listsController.addMember);
	server.post("/remove-member", { schema: listMemberSchema }, listsController.removeMember);
	server.post("/delete/:name", { schema: listInteractSchema }, listsController.deleteList);
	server.get("/:name/members", { schema: listMembersSchema }, userController.getListMembers);
	server.get("/:name/posts", { schema: listPostsSchema }, listsController.getPosts);
	done();
};

export default listsRouter;