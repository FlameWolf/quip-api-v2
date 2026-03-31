"use strict";

import requireAuthentication from "../hooks/requireAuthentication.ts";
import { listsSchema, listMemberSchema, listInteractSchema, listCreateSchema, listUpdateSchema, listMembersSchema, listPostsSchema } from "../requestDefinitions/lists.requests.ts";
import * as userController from "../controllers/users.controller.ts";
import * as listsController from "../controllers/lists.controller.ts";
import type { FastifyPluginAsync } from "fastify";

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