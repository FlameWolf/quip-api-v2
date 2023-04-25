"use strict";

import { ObjectId } from "bson";
import { Schema, model, Document, Model, InferSchemaType } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";

const followSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		followedBy: { type: ObjectId, ref: "User", required: true }
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
followSchema.index({ followedBy: 1, user: 1 }, { unique: true });
followSchema.plugin(uniqueValidator);

export default model<Document, Model<InferSchemaType<typeof followSchema>>>("Follow", followSchema);