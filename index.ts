"use strict";

import mongoose from "mongoose";
import "./schemaTypes/point";
import "./schemaTypes/url";
import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import multer = require("fastify-multer");
import { v2 as cloudinary } from "cloudinary";
import fastifyAuth from "@fastify/auth";
import { authenticateRequest, requireAuthentication } from "./hooks/authentication";
import indexRouter from "./routes/index.router";
import authRouter from "./routes/auth.router";
import usersRouter from "./routes/users.router";
import listsRouter from "./routes/lists.router";
import postsRouter from "./routes/posts.router";
import searchRouter from "./routes/search.router";
import settingsRouter from "./routes/settings.router";

const isProdEnv = process.env.NODE_ENV === "production";
if (!isProdEnv) {
	require("dotenv").config();
}

mongoose
	.connect(process.env.DB_CONNECTION as string)
	.then(() => {
		console.log("Connected to the database");
	})
	.catch(() => {
		console.log("Unable to connect to the database");
	});
cloudinary.config({
	cloud_name: process.env.CLOUD_BUCKET,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});

const server = fastify();
server.register(fastifyCors, {
	origin: process.env.ALLOW_ORIGIN,
	credentials: true,
	allowedHeaders: ["Authorization", "Origin", "X-Requested-With", "Content-Type", "Accept", "X-Slug", "X-UID"],
	methods: ["OPTIONS", "POST", "PUT", "PATCH", "GET", "DELETE"]
});
server.register(multer.contentParser).after(() => {
	if (!isProdEnv) {
		server.register(require("@fastify/swagger"), {
			routePrefix: "/swagger",
			exposeRoute: true,
			openapi: {
				version: "3.0.0",
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
	}
	server.register(fastifyAuth).after(() => {
		server.decorate("authenticateRequest", authenticateRequest);
		server.decorate("requireAuthentication", requireAuthentication);
		server.addHook("onRequest", server.auth([server.authenticateRequest]));
		server.register(indexRouter);
		server.register(authRouter, { prefix: "/auth" });
		server.register(usersRouter, { prefix: "/users" });
		server.register(listsRouter, { prefix: "/lists" });
		server.register(postsRouter, { prefix: "/posts" });
		server.register(searchRouter, { prefix: "/search" });
		server.register(settingsRouter, { prefix: "/settings" });
	});
});
server.setErrorHandler((err, request, reply) => {
	request.log.error(err.toString());
	reply.status(reply.statusCode || 500).send(err);
});
server.listen(
	{
		port: +process.env.PORT || 3072,
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