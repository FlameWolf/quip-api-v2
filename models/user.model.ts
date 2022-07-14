"use strict";

import { ObjectId } from "bson";
import { Schema, model } from "mongoose";
import { handleRegExp, passwordRegExp, emailRegExp } from "../library";
import * as uniqueValidator from "mongoose-unique-validator";

const userSchema = new Schema(
	{
		handle: {
			type: String,
			trim: true,
			required: true,
			unique: true,
			uniqueCaseInsensitive: true,
			validate: {
				validator: (value: string) => handleRegExp.test(value),
				message: "Handle is not valid"
			},
			index: true
		},
		password: {
			type: String,
			trim: true,
			required: true,
			validate: {
				validator: (value: string) => passwordRegExp.test(value),
				message: "Password is not valid"
			},
			select: false
		},
		email: {
			type: String,
			trim: true,
			validate: {
				validator: (value: string) => emailRegExp.test(value),
				message: "Email is not valid"
			},
			index: {
				partialFilterExpression: {
					email: {
						$exists: true,
						$ne: null
					}
				}
			},
			select: false
		},
		pinnedPost: { type: ObjectId, ref: "Post" },
		protected: { type: Boolean, default: false },
		deactivated: { type: Boolean, default: false },
		deleted: { type: Boolean, default: false }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
userSchema.plugin(uniqueValidator);

export default model("User", userSchema);