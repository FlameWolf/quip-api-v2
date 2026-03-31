"use strict";

import { searchNearbySchema, searchSchema, searchUsersSchema } from "../requestDefinitions/search.requests.ts";
import * as searchController from "../controllers/search.controller.ts";
import type { FastifyPluginAsync } from "fastify";

const searchRouter: FastifyPluginAsync = async (instance, options) => {
	instance.get("/", { schema: searchSchema }, searchController.searchPosts);
	instance.get("/nearby", { schema: searchNearbySchema }, searchController.nearbyPosts);
	instance.get("/users", { schema: searchUsersSchema }, searchController.searchUsers);
};

export default searchRouter;