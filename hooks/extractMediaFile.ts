"use strict";

import multer, { diskStorage } from "fastify-multer";
import * as path from "path";
import { validMimeTypes, megaByte, sanitiseFileName } from "../library";
import { preValidationHookHandler } from "fastify";

const extractMediaFile = multer({
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
	storage: diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join("public", `${req.fileType}s`));
		},
		filename: (req, file, cb) => {
			cb(null, `${sanitiseFileName(file.originalname.replace(new RegExp(`\.${req.fileSubtype as string}$`), ""), 16)}_${Date.now().valueOf()}`);
		}
	})
}).single("media") as preValidationHookHandler;

export default extractMediaFile;