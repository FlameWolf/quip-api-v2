"use strict";

import { FastifyPluginAsync } from "fastify";
import { searchNearbySchema, searchSchema, searchUsersSchema } from "../requestDefinitions/search.requests";
import * as searchController from "../controllers/search.controller";

const searchRouter: FastifyPluginAsync = async (instance, options) => {
	instance.get("/", { schema: searchSchema }, searchController.searchPosts);
	instance.get("/nearby", { schema: searchNearbySchema }, searchController.nearbyPosts);
	instance.get("/users", { schema: searchUsersSchema }, searchController.searchUsers);
};

export default searchRouter;