"use strict";

import { FromSchema } from "json-schema-to-ts";

export const settingsSchema = {
	body: {
		type: "object",
		properties: {
			user: { type: "string" },
			timeline: {
				type: "object",
				properties: {
					includeRepeats: {
						type: "boolean",
						default: true
					},
					includeReplies: {
						type: "boolean",
						default: true
					}
				}
			},
			activity: {
				type: "object",
				properties: {
					period: {
						type: "string",
						enum: ["day", "week", "month"]
					}
				}
			},
			topmost: {
				type: "object",
				properties: {
					period: {
						type: "string",
						enum: ["day", "week", "month", "year", "all"]
					}
				}
			},
			profile: {
				type: "object",
				properties: {
					includeRepeats: {
						type: "boolean",
						default: false
					},
					includeReplies: {
						type: "boolean",
						default: false
					}
				}
			}
		}
	}
} as const;
export const wordMuteSchema = {
	body: {
		type: "object",
		properties: {
			word: { type: "string" },
			match: {
				type: "string",
				enum: ["exact", "contains", "startsWith", "endsWith"]
			}
		},
		required: ["word", "match"]
	}
} as const;
export const requestApprovalSchema = {
	params: {
		type: "object",
		properties: {
			requestId: { type: "string" }
		},
		required: ["requestId"]
	}
} as const;
export const followRequestsSchema = {
	body: {
		type: "object",
		properties: {
			requestIds: {
				type: "array",
				items: { type: "string" }
			}
		},
		required: ["requestIds"]
	}
} as const;
export const blockedUsersSchema = {
	querystring: {
		type: "object",
		properties: {
			lastBlockId: { type: "string" }
		}
	}
} as const;
export const mutedItemsSchema = {
	querystring: {
		type: "object",
		properties: {
			lastMuteId: { type: "string" }
		}
	}
} as const;
export const updateEmailSchema = {
	body: {
		type: "object",
		properties: {
			email: { type: "string" }
		},
		required: ["email"]
	}
} as const;
export const changePasswordSchema = {
	body: {
		type: "object",
		properties: {
			oldPassword: { type: "string" },
			newPassword: { type: "string" }
		},
		required: ["oldPassword", "newPassword"]
	}
} as const;
export const getSettingSchema = {
	params: {
		type: "object",
		properties: {
			path: { type: "string" }
		},
		required: ["path"]
	}
} as const;
export const updateSettingSchema = {
	...getSettingSchema,
	querystring: {
		type: "object",
		properties: {
			value: { type: "string" }
		},
		required: ["value"]
	}
} as const;

export type SettingsBody = FromSchema<typeof settingsSchema.body>;
export type WordMuteBody = FromSchema<typeof wordMuteSchema.body>;
export type RequestApprovalParams = FromSchema<typeof requestApprovalSchema.params>;
export type FollowRequestBody = FromSchema<typeof followRequestsSchema.body>;
export type BlockedUsersQueryString = FromSchema<typeof blockedUsersSchema.querystring>;
export type MutedItemsQueryString = FromSchema<typeof mutedItemsSchema.querystring>;
export type UpdateEmailBody = FromSchema<typeof updateEmailSchema.body>;
export type ChangePasswordBody = FromSchema<typeof changePasswordSchema.body>;
export type GetSettingParams = FromSchema<typeof getSettingSchema.params>;
export type UpdateSettingQueryString = FromSchema<typeof updateSettingSchema.querystring>;