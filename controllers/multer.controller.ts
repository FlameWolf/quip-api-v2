"use strict";

import multer from "fastify-multer";
import { File, FileFilterCallback } from "fastify-multer/lib/interfaces";
import { createCloudinaryStorage } from "multer-storage-cloudinary";
import { megaByte } from "../library";
import * as cloudinary from "cloudinary";

const validMimeTypes = ["image", "video"];
const sanitise = (value: string, maxLength?: number) => value.trim().substring(0, maxLength).replace(/\W/g, "_");
const extractMediaFile = multer({
	fileFilter: (request: Dictionary, file: File, cb: FileFilterCallback) => {
		const [type, subtype] = file.mimetype.split("/");
		request.fileType = type;
		request.fileSubtype = subtype;
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		cb(isValid ? null : new Error("Invalid file type"), isValid);
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: createCloudinaryStorage({
		cloudinary: cloudinary.v2,
		params: (request: Dictionary, file: File) => ({
			folder: `${request.fileType}s/`,
			public_id: `${sanitise(file.originalname.replace(/\.\w+$/, ""), 16)}_${Date.now().valueOf()}`
		})
	})
});

export const uploadMediaFileToCloud = extractMediaFile.single("media");