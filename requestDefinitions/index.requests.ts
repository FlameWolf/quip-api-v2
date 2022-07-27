"use strict";

import { FromSchema } from "json-schema-to-ts";

export const timelineSchema = {
	querystring: {
		type: "object",
		properties: {
			includeRepeats: { type: "boolean" },
			includeReplies: { type: "boolean" },
			lastPostId: { type: "string" }
		}
	}
} as const;
export const activitySchema = {
	params: {
		type: "object",
		properties: {
			period: {
				type: "string",
				enum: ["?", "day", "week", "month"]
			}
		}
	},
	querystring: {
		type: "object",
		properties: {
			lastEntryId: { type: "string" }
		}
	}
} as const;
export const topmostSchema = {
	params: {
		type: "object",
		properties: {
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
export const hashtagSchema = {
	params: {
		type: "object",
		properties: {
			name: { type: "string" }
		},
		required: ["name"]
	},
	querystring: {
		type: "object",
		properties: {
			sortBy: {
				type: "string",
				enum: ["date", "popular"]
			},
			lastScore: { type: "integer" },
			lastPostId: { type: "string" }
		}
	}
} as const;
export const emailApprovalSchema = {
	params: {
		type: "object",
		properties: {
			token: { type: "string" }
		},
		required: ["token"]
	}
} as const;
export const forgotPasswordSchema = {
	body: {
		type: "object",
		properties: {
			handle: { type: "string" },
			email: { type: "string" }
		},
		required: ["handle", "email"]
	}
} as const;
export const resetPasswordSchema = {
	params: {
		type: "object",
		properties: {
			token: { type: "string" }
		},
		required: ["token"]
	},
	body: {
		type: "object",
		properties: {
			password: { type: "string" }
		},
		required: ["password"]
	}
} as const;

export type TimelineQueryString = FromSchema<typeof timelineSchema.querystring>;
export type ActivityParams = FromSchema<typeof activitySchema.params>;
export type ActivityQueryString = FromSchema<typeof activitySchema.querystring>;
export type TopmostParams = FromSchema<typeof topmostSchema.params>;
export type TopmostQueryString = FromSchema<typeof topmostSchema.querystring>;
export type HashtagParams = FromSchema<typeof hashtagSchema.params>;
export type HashtagQueryString = FromSchema<typeof hashtagSchema.querystring>;
export type EmailApprovalParams = FromSchema<typeof emailApprovalSchema.params>;
export type ForgotPasswordBody = FromSchema<typeof forgotPasswordSchema.body>;
export type ResetPasswordParams = FromSchema<typeof resetPasswordSchema.params>;
export type ResetPasswordBody = FromSchema<typeof resetPasswordSchema.body>;