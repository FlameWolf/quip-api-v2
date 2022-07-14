"use strict";

import { FromSchema } from "json-schema-to-ts";

export const searchSchema = {
	querystring: {
		type: "object",
		properties: {
			q: { type: "string" },
			from: { type: "string" },
			since: { type: "string" },
			until: { type: "string" },
			"has-media": { type: "string" },
			"not-from": { type: "string" },
			"sort-by": {
				type: "string",
				enum: ["match", "date", "popular"]
			},
			"date-order": {
				type: "string",
				enum: ["desc", "asc"]
			},
			replies: {
				type: "string",
				enum: ["exclude", "only"]
			},
			langs: { type: "string" },
			"langs-match": {
				type: "string",
				enum: ["any", "all"]
			},
			"media-desc": { type: "string" },
			lastScore: { type: "integer" },
			lastPostId: { type: "string" }
		}
	}
} as const;
export const searchNearbySchema = {
	querystring: {
		type: "object",
		properties: {
			long: {
				type: "number",
				format: "float",
				minimum: -180,
				maximum: 180
			},
			lat: {
				type: "number",
				format: "float",
				minimum: -90,
				maximum: 90
			},
			"max-dist": {
				type: "integer",
				minimum: 0,
				maximum: 50000
			},
			lastDistance: {
				type: "number",
				format: "double"
			},
			lastPostId: { type: "string" }
		},
		required: ["long", "lat"]
	}
} as const;
export const searchUsersSchema = {
	querystring: {
		type: "object",
		properties: {
			q: { type: "string" },
			match: {
				type: "string",
				enum: ["exact", "contains", "startsWith", "endsWith"]
			},
			"date-order": {
				type: "string",
				enum: ["desc", "asc"]
			},
			lastUserId: { type: "string" }
		},
		required: ["q"]
	}
} as const;

export type SearchQueryString = FromSchema<typeof searchSchema.querystring>;
export type SearchNearbyQueryString = FromSchema<typeof searchNearbySchema.querystring>;
export type SearchUsersQueryString = FromSchema<typeof searchUsersSchema.querystring>;