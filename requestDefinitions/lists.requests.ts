"use strict";

import { FromSchema } from "json-schema-to-ts";

export const listsSchema = {
	querystring: {
		type: "object",
		properties: {
			memberHandle: { type: "string" },
			lastListId: { type: "string" }
		}
	}
} as const;
export const listCreateSchema = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
			includeRepeats: {
				type: "boolean",
				default: true
			},
			includeReplies: {
				type: "boolean",
				default: true
			}
		},
		required: ["name"]
	}
} as const;
export const listUpdateSchema = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
			newName: {
				type: "string"
			},
			includeRepeats: {
				type: "boolean",
				default: true
			},
			includeReplies: {
				type: "boolean",
				default: true
			}
		},
		required: ["name"]
	}
} as const;
export const listMemberSchema = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
			handle: { type: "string" }
		},
		required: ["name", "handle"]
	}
} as const;
export const listInteractSchema = {
	params: {
		type: "object",
		properties: {
			name: { type: "string" }
		},
		required: ["name"]
	}
} as const;
export const listMembersSchema = {
	...listInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastMemberId: { type: "string" }
		}
	}
} as const;
export const listPostsSchema = {
	...listInteractSchema,
	querystring: {
		type: "object",
		properties: {
			includeRepeats: { type: "boolean" },
			includeReplies: { type: "boolean" },
			lastPostId: { type: "string" }
		}
	}
} as const;

export type ListsQueryString = FromSchema<typeof listsSchema.querystring>;
export type ListCreateBody = FromSchema<typeof listCreateSchema.body>;
export type ListUpdateBody = FromSchema<typeof listUpdateSchema.body>;
export type ListMemberBody = FromSchema<typeof listMemberSchema.body>;
export type ListInteractParams = FromSchema<typeof listInteractSchema.params>;
export type ListMembersQueryString = FromSchema<typeof listMembersSchema.querystring>;
export type ListPostsQueryString = FromSchema<typeof listPostsSchema.querystring>;