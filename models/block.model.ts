"use strict";

import { ObjectId } from "bson";
import { model, Schema } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";
import { contentLengthRegExp, maxContentLength } from "../library";

const blockSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		blockedBy: { type: ObjectId, ref: "User", required: true },
		reason: {
			type: String,
			trim: true,
			validate: {
				validator: (value: string) => (value.match(contentLengthRegExp)?.length || 0) <= maxContentLength,
				message: "Reason length exceeds the maximum allowed limit"
			}
		}
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
blockSchema.index({ blockedBy: 1, user: 1 }, { unique: true });
blockSchema.plugin(uniqueValidator);

export default model("Block", blockSchema);