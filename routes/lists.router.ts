"use strict";

import { FastifyPluginAsync } from "fastify";
import requireAuthentication from "../hooks/requireAuthentication";
import { listsSchema, listMemberSchema, listInteractSchema, listCreateSchema, listUpdateSchema, listMembersSchema, listPostsSchema } from "../requestDefinitions/lists.requests";
import * as userController from "../controllers/users.controller";
import * as listsController from "../controllers/lists.controller";

const listsRouter: FastifyPluginAsync = async (instance, options) => {
	instance.addHook("onRequest", requireAuthentication);
	instance.get("/", { schema: listsSchema }, userController.getLists);
	instance.post("/create", { schema: listCreateSchema }, listsController.createList);
	instance.post("/update", { schema: listUpdateSchema }, listsController.updateList);
	instance.post("/add-member", { schema: listMemberSchema }, listsController.addMember);
	instance.post("/remove-member", { schema: listMemberSchema }, listsController.removeMember);
	instance.delete("/delete/:name", { schema: listInteractSchema }, listsController.deleteList);
	instance.get("/:name/members", { schema: listMembersSchema }, userController.getListMembers);
	instance.get("/:name/posts", { schema: listPostsSchema }, listsController.getPosts);
};

export default listsRouter;