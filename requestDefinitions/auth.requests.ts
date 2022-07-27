"use strict";

import { FromSchema } from "json-schema-to-ts";

export const credentialsSchema = {
	body: {
		type: "object",
		properties: {
			handle: { type: "string" },
			password: { type: "string" }
		},
		required: ["handle", "password"]
	}
} as const;
export const refreshTokenSchema = {
	headers: {
		type: "object",
		properties: {
			"x-slug": { type: "string" },
			"x-uid": { type: "string" }
		},
		required: ["x-slug", "x-uid"]
	},
	body: {
		type: "object",
		properties: {
			refreshToken: { type: "string" }
		},
		required: ["refreshToken"]
	}
} as const;
export const revokeTokenSchema = {
	params: {
		type: "object",
		properties: {
			token: { type: "string" }
		},
		required: ["token"]
	}
} as const;

export type AuthPayload = {
	userId: string;
	authToken: string;
	refreshToken?: string;
	createdAt: number;
	expiresIn: number;
};
export type CredentialsBody = FromSchema<typeof credentialsSchema.body>;
export type RefreshTokenHeaders = FromSchema<typeof refreshTokenSchema.headers>;
export type RefreshTokenBody = FromSchema<typeof refreshTokenSchema.body>;
export type RevokeTokenParams = FromSchema<typeof revokeTokenSchema.params>;