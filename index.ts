"use strict";

import jwt from "jsonwebtoken";
import { emptyString, megaByte, standardiseFileName, validMimeTypes } from "./library.ts";
import { DiscStorage, type FormDataParserPluginOptions } from "formzilla";

const isProdEnv = process.env.NODE_ENV === "production";
if (!isProdEnv) {
	(await import("dotenv")).config();
}
await import("./schemaTypes/point.ts");
await import("./schemaTypes/url.ts");
(await import("mongoose"))
	.connect(process.env.DB_CONNECTION as string)
	.then(() => {
		console.log("Connected to the database");
	})
	.catch(() => {
		console.log("Unable to connect to the database");
	});
(await import("cloudinary")).v2.config({
	cloud_name: process.env.CLOUD_BUCKET,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});
const allowedOrigins = process.env.ALLOW_ORIGINS || emptyString;
const server = (await import("fastify")).fastify();
server.register((await import("@fastify/helmet")).fastifyHelmet);
server.addHook("onRequest", async (request, reply) => {
	const origin = request.headers.origin || emptyString;
	reply.header("Access-Control-Allow-Origin", (allowedOrigins.indexOf(`${origin};`) > -1 && origin) || "*");
	reply.header("Access-Control-Allow-Credentials", true);
	reply.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-Slug, X-UID");
	reply.header("Access-Control-Allow-Methods", "OPTIONS, POST, PUT, PATCH, GET, DELETE");
	if (request.method === "OPTIONS") {
		reply.status(200).send();
	}
});
server.register((await import("formzilla")).default, {
	limits: {
		fileSize: megaByte * 5
	},
	storage: new DiscStorage(async file => {
		[file.type, file.subType] = file.mimeType.split("/");
		const isValid = validMimeTypes.some(mimeType => mimeType === file.type);
		if (!isValid) {
			throw new Error("Invalid file type");
		}
		return {
			directory: (await import("path")).default.join(__dirname, "public"),
			fileName: standardiseFileName(file.originalName)
		};
	})
} as FormDataParserPluginOptions);
if (!isProdEnv) {
	server.register((await import("@fastify/swagger")).fastifySwagger, {
		openapi: {
			info: {
				title: "Quip API",
				version: "1.0.0"
			},
			components: {
				securitySchemes: {
					Bearer: {
						type: "apiKey",
						name: "Authorization",
						in: "header",
						description: "Enter your bearer token in the format **Bearer &#x3C;token&#x3E;**"
					}
				}
			},
			security: [
				{
					Bearer: []
				}
			]
		}
	});
	server.register((await import("@fastify/swagger-ui")).fastifySwaggerUi, {
		routePrefix: "/swagger",
		uiConfig: {
			persistAuthorization: true
		}
	});
}
server.decorateRequest("userInfo", null as unknown as UserInfo);
server.addHook("onRequest", async (request, reply) => {
	try {
		const authToken = request.headers.authorization?.replace(/^bearer\s+/i, emptyString);
		request.userInfo = authToken && (jwt.verify(authToken, process.env.JWT_AUTH_SECRET as string) as UserInfo);
	} catch {}
});
server.register((await import("./routes/index.router.ts")).default);
server.register((await import("./routes/auth.router.ts")).default, { prefix: "/auth" });
server.register((await import("./routes/users.router.ts")).default, { prefix: "/users" });
server.register((await import("./routes/lists.router.ts")).default, { prefix: "/lists" });
server.register((await import("./routes/posts.router.ts")).default, { prefix: "/posts" });
server.register((await import("./routes/search.router.ts")).default, { prefix: "/search" });
server.register((await import("./routes/settings.router.ts")).default, { prefix: "/settings" });
server.setErrorHandler(async (error, request, reply) => {
	reply.status(500).send(error);
});
server.listen(
	{
		port: +(process.env.PORT as string) || 3072,
		host: process.env.HOST || "::"
	},
	(err, address) => {
		if (err) {
			console.log(err.message);
			process.exit(1);
		}
		console.log(`Listening on ${address}`);
	}
);