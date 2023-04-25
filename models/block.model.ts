"use strict";

import { ObjectId } from "bson";
import { Schema, model, Document, Model, InferSchemaType } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";
import { maxContentLength, getUnicodeClusterCount } from "../library";

const blockSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		blockedBy: { type: ObjectId, ref: "User", required: true },
		reason: {
			type: String,
			trim: true,
			validate: {
				validator: (value: string) => getUnicodeClusterCount(value) <= maxContentLength,
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

export default model<Document, Model<InferSchemaType<typeof blockSchema>>>("Block", blockSchema);