"use strict";

import multer, { memoryStorage } from "fastify-multer";
import { megaByte } from "../library";
import { preValidationHookHandler } from "fastify";

const validMimeTypes = ["image", "video"];
const factory = multer({
	fileFilter: (request, file, cb) => {
		const [type, subtype] = file.mimetype.split("/");
		request.fileType = type.trim();
		request.fileSubtype = subtype.trim();
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		cb(isValid ? null : new Error("Invalid file type"), isValid);
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: memoryStorage()
});
const extractMediaFile = factory.single("media") as preValidationHookHandler;

export default extractMediaFile;