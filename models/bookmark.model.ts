"use strict";

import { ObjectId } from "bson";
import { Schema, model, Document, Model, InferSchemaType } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";

const bookmarkSchema = new Schema(
	{
		post: { type: ObjectId, ref: "Post", required: true, index: true },
		bookmarkedBy: { type: ObjectId, ref: "User", required: true }
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
bookmarkSchema.index({ bookmarkedBy: 1, post: 1 }, { unique: true });
bookmarkSchema.plugin(uniqueValidator);

export default model<Document, Model<InferSchemaType<typeof bookmarkSchema>>>("Bookmark", bookmarkSchema);