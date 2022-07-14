"use strict";

import { ObjectId } from "bson";
import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		token: { type: String, trim: true, required: true, max: 512 },
		lastUsed: { type: Date, default: new Date() }
	},
	{
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
refreshTokenSchema.index({ token: 1, user: 1 });
refreshTokenSchema.index({ lastUsed: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export default model("RefreshToken", refreshTokenSchema);