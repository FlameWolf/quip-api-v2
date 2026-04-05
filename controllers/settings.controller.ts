"use strict";

import { ObjectId } from "mongodb";
import { setProperty, getProperty } from "../library.ts";
import Settings from "../models/settings.model.ts";
import type { RouteHandlerMethod } from "fastify";
import type { SettingInteractParams, UpdateSettingQuery, SettingsBody } from "../requestDefinitions/settings.requests.ts";

const getSettingsByUserId = async (userId: string | ObjectId) => {
	const param = { user: userId };
	const settings = await Settings.findOne(param);
	if (!settings) {
		return await new Settings(param).save();
	}
	return settings;
};
export const updateSettingsByUserId = async (userId: string | ObjectId, settings: Dictionary) =>
	await Settings.findOneAndUpdate(
		{
			user: userId
		},
		settings,
		{
			new: true,
			upsert: true
		}
	);
export const getSettings: RouteHandlerMethod = async (request, reply) => {
	const userId = (request.userInfo as UserInfo).userId;
	reply.status(200).send({ settings: await getSettingsByUserId(userId) });
};
export const getSettingByPath: RouteHandlerMethod = async (request, reply) => {
	const { path } = request.params as SettingInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const settings = await getSettingsByUserId(userId);
	const value = getProperty(settings, path);
	reply.status(200).send({ [path]: value });
};
export const updateSettings: RouteHandlerMethod = async (request, reply) => {
	const settings = request.body as SettingsBody;
	const userId = (request.userInfo as UserInfo).userId;
	const updated = await updateSettingsByUserId(userId, settings);
	reply.status(200).send({ updated });
};
export const updateSettingByPath: RouteHandlerMethod = async (request, reply) => {
	const { path } = request.params as SettingInteractParams;
	const { value } = request.query as UpdateSettingQuery;
	const userId = (request.userInfo as UserInfo).userId;
	const settings = {};
	setProperty(settings, path, value);
	const updated = await updateSettingsByUserId(userId, settings);
	reply.status(200).send({ updated });
};