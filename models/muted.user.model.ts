"use strict";

import { ObjectId } from "mongodb";
import { Schema, model, Document, Model, InferSchemaType } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const mutedUserSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
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
mutedUserSchema.index({ mutedBy: 1, user: 1 }, { unique: true });
mutedUserSchema.plugin(uniqueValidator);

export default model<Document, Model<InferSchemaType<typeof mutedUserSchema>>>("MutedUser", mutedUserSchema);