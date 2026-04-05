"use strict";

import type { FromSchema } from "json-schema-to-ts";

export const userInteractSchema = {
	params: {
		type: "object",
		properties: {
			handle: { type: "string" }
		},
		required: ["handle"]
	}
} as const;
export const actionReasonSchema = {
	querystring: {
		type: "object",
		properties: {
			reason: { type: "string" }
		}
	}
} as const;
export const blockMuteUserSchema = {
	...userInteractSchema,
	...actionReasonSchema
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
export type ActionReasonQuery = FromSchema<typeof actionReasonSchema.querystring>;
export type UserPostsQuery = FromSchema<typeof userPostsSchema.querystring>;
export type UserTopmostParams = FromSchema<typeof userTopmostSchema.params>;
export type UserTopmostQuery = FromSchema<typeof userTopmostSchema.querystring>;
export type UserFavouritesQuery = FromSchema<typeof userFavouritesSchema.querystring>;
export type UserVotesQuery = FromSchema<typeof userVotesSchema.querystring>;
export type UserBookmarksQuery = FromSchema<typeof userBookmarksSchema.querystring>;
export type UserFollowsQuery = FromSchema<typeof userFollowsSchema.querystring>;
export type UserFollowRequestsQuery = FromSchema<typeof userFollowRequestsSchema.querystring>;
export type UserMentionsQuery = FromSchema<typeof userMentionsSchema.querystring>;