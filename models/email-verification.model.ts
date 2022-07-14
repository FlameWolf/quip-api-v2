"use strict";

import { ObjectId } from "bson";
import { Schema, model } from "mongoose";
import { emailRegExp } from "../library";

const emailVerificationSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		email: {
			type: String,
			trim: true,
			validate: {
				validator: (value: string) => emailRegExp.test(value),
				message: "Email is not valid"
			}
		},
		previousEmail: { type: String, trim: true },
		token: { type: ObjectId, required: true }
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false
		},
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default model("EmailVerification", emailVerificationSchema);