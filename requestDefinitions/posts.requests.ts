"use strict";

import { FromSchema } from "json-schema-to-ts";

export const postCreateSchema = {
	consumes: ["multipart/form-data"],
	body: {
		type: "object",
		properties: {
			content: { type: "string" },
			poll: {
				type: "object",
				properties: {
					first: { type: "string" },
					second: { type: "string" },
					third: { type: "string" },
					fourth: { type: "string" },
					duration: {
						type: "integer",
						format: "int64",
						minimum: 1800000,
						maximum: 604800000,
						default: 86400000
					}
				},
				required: ["first", "second", "duration"]
			},
			media: {
				type: "string",
				format: "binary"
			},
			"media-description": { type: "string" },
			location: {
				type: "object",
				properties: {
					type: {
						type: "string",
						enum: ["Point"]
					},
					coordinates: {
						type: "array",
						items: {
							type: "integer",
							minimum: -180,
							maximum: 180
						}
					}
				},
				required: ["type", "coordinates"]
			}
		}
	}
} as const;
export const postInteractSchema = {
	params: {
		type: "object",
		properties: {
			postId: { type: "string" }
		},
		required: ["postId"]
	}
} as const;
export const postUpdateSchema = {
	...postInteractSchema,
	body: {
		type: "object",
		properties: {
			content: { type: "string" }
		},
		required: ["content"]
	}
} as const;
export const postInteractAndCreateSchema = {
	...postInteractSchema,
	...postCreateSchema
} as const;
export const postVoteSchema = {
	...postInteractSchema,
	querystring: {
		type: "object",
		properties: {
			option: {
				type: "string",
				enum: ["first", "second", "third", "fourth", "nota"]
			}
		},
		required: ["option"]
	}
} as const;
export const postQuotesSchema = {
	...postInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastQuoteId: { type: "string" }
		}
	}
} as const;
export const postRepliesSchema = {
	...postInteractSchema,
	querystring: {
		type: "object",
		properties: {
			lastReplyId: { type: "string" }
		}
	}
} as const;

export type PostCreateBody = FromSchema<typeof postCreateSchema.body>;
export type PostInteractParams = FromSchema<typeof postInteractSchema.params>;
export type PostUpdateBody = FromSchema<typeof postUpdateSchema.body>;
export type PostVoteQueryString = FromSchema<typeof postVoteSchema.querystring>;
export type PostQuotesQueryString = FromSchema<typeof postQuotesSchema.querystring>;
export type PostRepliesQueryString = FromSchema<typeof postRepliesSchema.querystring>;