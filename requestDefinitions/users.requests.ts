"use strict";

import { FromSchema } from "json-schema-to-ts";

export const userInteractSchema = {
	params: {
		type: "object",
		properties: {
			handle: { type: "string" }
		},
		required: ["handle"]
	}
} as const;
export const blockUserSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			reason: { type: "string" }
		}
	}
} as const;
export const userPostsSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			includeRepeats: { type: "boolean" },
			includeReplies: { type: "boolean" },
			lastPostId: { type: "string" }
		}
	}
} as const;
export const userTopmostSchema = {
	params: {
		...userInteractSchema.params,
		properties: {
			...userInteractSchema.params.properties,
			period: {
				type: "string",
				enum: ["?", "day", "week", "month", "year", "all"]
			}
		}
	},
	querystring: {
		type: "object",
		properties: {
			lastScore: { type: "integer" },
			lastPostId: { type: "string" }
		}
	}
} as const;
export const userFavouritesSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastFavouriteId: { type: "string" }
		}
	}
} as const;
export const userVotesSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastVoteId: { type: "string" }
		}
	}
} as const;
export const userBookmarksSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastBookmarkId: { type: "string" }
		}
	}
} as const;
export const userFollowsSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastFollowId: { type: "string" }
		}
	}
} as const;
export const userFollowRequestsSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastFollowRequestId: { type: "string" }
		}
	}
} as const;
export const userMentionsSchema = {
	...userInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastMentionId: { type: "string" }
		}
	}
} as const;

export type UserInteractParams = FromSchema<typeof userInteractSchema.params>;
export type BlockUserQueryString = FromSchema<typeof blockUserSchema.querystring>;
export type UserPostsQueryString = FromSchema<typeof userPostsSchema.querystring>;
export type UserTopmostParams = FromSchema<typeof userTopmostSchema.params>;
export type UserTopmostQueryString = FromSchema<typeof userTopmostSchema.querystring>;
export type UserFavouritesQueryString = FromSchema<typeof userFavouritesSchema.querystring>;
export type UserVotesQueryString = FromSchema<typeof userVotesSchema.querystring>;
export type UserBookmarksQueryString = FromSchema<typeof userBookmarksSchema.querystring>;
export type UserFollowsQueryString = FromSchema<typeof userFollowsSchema.querystring>;
export type UserFollowRequestsQueryString = FromSchema<typeof userFollowRequestsSchema.querystring>;
export type UserMentionsQueryString = FromSchema<typeof userMentionsSchema.querystring>;