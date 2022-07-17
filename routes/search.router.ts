"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import { searchNearbySchema, searchSchema, searchUsersSchema } from "../requestDefinitions/search.requests";
import * as searchController from "../controllers/search.controller";

const searchRouter = (instance: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	instance.get("/", { schema: searchSchema }, searchController.searchPosts);
	instance.get("/nearby", { schema: searchNearbySchema }, searchController.nearbyPosts);
	instance.get("/users", { schema: searchUsersSchema }, searchController.searchUsers);
	done();
};

export default searchRouter;