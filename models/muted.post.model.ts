"use strict";

import { ObjectId } from "bson";
import { Schema, model } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";

const mutedPostSchema = new Schema(
	{
		post: { type: ObjectId, ref: "Post", required: true, index: true },
		mutedBy: { type: ObjectId, ref: "User", required: true }
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
mutedPostSchema.index({ mutedBy: 1, post: 1 }, { unique: true });
mutedPostSchema.plugin(uniqueValidator);

export default model("MutedPost", mutedPostSchema);