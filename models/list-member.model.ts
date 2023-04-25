"use strict";

import { ObjectId } from "bson";
import { Schema, model, Document, Model, InferSchemaType } from "mongoose";
import * as uniqueValidator from "mongoose-unique-validator";

const listMemberSchema = new Schema(
	{
		list: { type: ObjectId, ref: "List", required: true, index: true },
		user: { type: ObjectId, ref: "User", required: true }
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
listMemberSchema.index({ user: 1, list: 1 }, { unique: true });
listMemberSchema.plugin(uniqueValidator);

export default model<Document, Model<InferSchemaType<typeof listMemberSchema>>>("ListMember", listMemberSchema);