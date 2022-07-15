"use strict";

import { FastifyRequest } from "fastify";
import multer, { memoryStorage } from "fastify-multer";
import { File, FileFilterCallback } from "fastify-multer/lib/interfaces";
import { megaByte } from "../library";

const validMimeTypes = ["image", "video"];
const factory = multer({
	fileFilter: (request: FastifyRequest, file: File, cb: FileFilterCallback) => {
		const [type, subtype] = file.mimetype.split("/");
		request.fileType = type;
		request.fileSubtype = subtype;
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		cb(isValid ? null : new Error("Invalid file type"), isValid);
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: memoryStorage()
});
export const extractMediaFile = factory.single("media");
export const sanitiseFileName = (value: string, maxLength?: number) => value.trim().substring(0, maxLength).replace(/\W/g, "_");