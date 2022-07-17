"use strict";

import { FastifyInstance, FastifyPluginOptions, HookHandlerDoneFunction } from "fastify";
import { searchNearbySchema, searchSchema, searchUsersSchema } from "../requestDefinitions/search.requests";
import * as searchController from "../controllers/search.controller";

const searchRouter = (server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) => {
	server.get("/", { schema: searchSchema }, searchController.searchPosts);
	server.get("/nearby", { schema: searchNearbySchema }, searchController.nearbyPosts);
	server.get("/users", { schema: searchUsersSchema }, searchController.searchUsers);
	done();
};

export default searchRouter;