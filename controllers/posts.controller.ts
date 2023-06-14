"use strict";

import { ObjectId } from "bson";
import { RouteHandlerMethod } from "fastify";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import * as cld from "cld";
import { File as MulterFile } from "fastify-multer/lib/interfaces";
import { v2 as cloudinary } from "cloudinary";
import { maxContentLength, nullId, quoteScore, repeatScore, replyScore, voteScore, getUnicodeClusterCount } from "../library";
import postAggregationPipeline from "../db/pipelines/post";
import postParentAggregationPipeline from "../db/pipelines/post-parent";
import postQuotesAggregationPipeline from "../db/pipelines/post-quotes";
import postRepliesAggregationPipeline from "../db/pipelines/post-replies";
import Bookmark from "../models/bookmark.model";
import Favourite from "../models/favourite.model";
import MutedPost from "../models/muted.post.model";
import Post from "../models/post.model";
import User from "../models/user.model";
import Vote from "../models/vote.model";
import { PostCreateBody, PostInteractParams, PostQuotesQueryString, PostRepliesQueryString, PostUpdateBody, PostVoteQueryString } from "../requestDefinitions/posts.requests";

type PostModel = InferSchemaType<typeof Post.schema>;
type AttachmentsModel = Required<PostModel>["attachments"];
type PollModel = AttachmentsModel["poll"];
type LanguageEntry = InferArrayElementType<PostModel["languages"]>;
type MentionEntry = InferArrayElementType<PostModel["mentions"]>;
type HashtagEntry = InferArrayElementType<PostModel["hashtags"]>;

export const findPostById = async (postId: string | ObjectId): Promise<HydratedDocument<PostModel>> => {
	const post = await Post.findById(postId);
	const repeatPost = post?.repeatPost as ObjectId;
	return repeatPost ? await findPostById(repeatPost) : (post as HydratedDocument<PostModel>);
};
const validateContent = (content: string, poll?: Dictionary, media?: MulterFile, postId?: string | ObjectId) => {
	if (!content.trim()) {
		if (poll || !(media || postId)) {
			throw new Error("No content");
		}
	}
	if (getUnicodeClusterCount(content) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const detectLanguages = async (value: string) => {
	if (value.trim()) {
		try {
			return (await cld.detect(value)).languages.map((language: { code: string }) => language.code);
		} catch {
			return ["xx"];
		}
	}
	return [];
};
const updateLanguages = async (post: Partial<PostModel> | DeepPartial<PostModel>) => {
	const languages = new Set(post.languages);
	const promises = [];
	const { content, attachments } = post;
	promises.push(content && (await detectLanguages(content as string)));
	if (attachments) {
		const { poll, mediaFile } = attachments;
		if (poll) {
			const { first, second, third, fourth } = poll;
			promises.push(first && (await detectLanguages(first as string)), second && (await detectLanguages(second as string)), third && (await detectLanguages(third as string)), fourth && (await detectLanguages(fourth as string)));
		}
		if (mediaFile) {
			const mediaDescription = mediaFile.description;
			promises.push(mediaDescription && (await detectLanguages(mediaDescription as string)));
		}
	}
	for (const language of (await Promise.all(promises)).flat()) {
		if (language) {
			languages.add(language as LanguageEntry);
		}
	}
	post.languages = [...languages];
};
const updateMentionsAndHashtags = async (content: string, post: Partial<PostModel> | DeepPartial<PostModel>) => {
	const postMentions = new Set(post.mentions?.map(mention => mention?.toString()));
	const postHashtags = new Set(post.hashtags);
	const contentMentions = content.match(/\B@\w+/g);
	const contentHashtags = content.match(/\B#(\p{L}\p{M}?)+/gu);
	if (contentMentions) {
		const users = await User.find(
			{
				handle: {
					$in: contentMentions.map(mention => mention.substring(1))
				},
				deactivated: false,
				deleted: false
			},
			{
				_id: 1
			}
		);
		users.map(user => user._id).forEach(userId => postMentions.add(userId.toString()));
	}
	if (contentHashtags) {
		contentHashtags.map(hashtag => hashtag.substring(1)).forEach(hashtag => postHashtags.add(hashtag as HashtagEntry));
	}
	post.mentions = postMentions.size > 0 ? [...postMentions].map(mention => new ObjectId(mention) as MentionEntry) : undefined;
	post.hashtags = postHashtags.size > 0 ? [...postHashtags] : undefined;
};
const uploadFile = async (file: MulterFile, fileType: string) => {
	const response = await cloudinary.uploader.upload(file.path as string, {
		resource_type: fileType as any,
		folder: `${fileType}s/`,
		public_id: file.filename
	});
	return response;
};
const deletePostWithCascade = async (post: HydratedDocument<PostModel>) => {
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const postId = post._id;
		const postFilter = { post: postId as ObjectId };
		const repeatedPostId = post.repeatPost;
		const repliedToPostId = post.replyTo;
		const attachments = post.attachments;
		await Post.deleteOne(post as PostModel).session(session);
		if (repeatedPostId) {
			await Post.findByIdAndUpdate(repeatedPostId, {
				$inc: {
					score: -repeatScore
				}
			}).session(session);
		}
		if (repliedToPostId) {
			await Post.findByIdAndUpdate(repliedToPostId, {
				$inc: {
					score: -replyScore
				}
			}).session(session);
		}
		if (attachments) {
			const quotedPostId = attachments.post;
			const poll = attachments.poll as HydratedDocument<PollModel>;
			if (quotedPostId) {
				await Post.findByIdAndUpdate(quotedPostId, {
					$inc: {
						score: -quoteScore
					}
				}).session(session);
			}
			if (poll) {
				await Vote.deleteMany({ poll: poll._id }).session(session);
			}
		}
		await Promise.all([
			User.findOneAndUpdate(
				{
					_id: post.author
				},
				{
					$pull: {
						posts: postId
					}
				}
			).session(session),
			User.findOneAndUpdate(
				{
					pinnedPost: postId
				},
				{
					pinnedPost: undefined
				}
			).session(session),
			Post.deleteMany({
				repeatPost: postId
			}).session(session),
			Favourite.deleteMany(postFilter).session(session),
			Bookmark.deleteMany(postFilter).session(session),
			MutedPost.deleteMany(postFilter).session(session)
		]);
	});
	await session.endSession();
};
export const createPost: RouteHandlerMethod = async (request, reply) => {
	const { content = "", poll, "media-description": mediaDescription, location } = request.body as PostCreateBody;
	const { file: media, fileType } = request;
	const userId = (request.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media);
	} catch (err: any) {
		reply.status(400).send(err);
		return;
	}
	const model = {
		content,
		author: userId as any,
		...((poll || media) && {
			attachments: {
				...(poll && { poll }),
				...(media && {
					mediaFile: {
						fileType: fileType as any,
						src: (await uploadFile(media, fileType as string)).secure_url as any,
						previewSrc: undefined,
						description: mediaDescription
					}
				})
			}
		}),
		...(location && {
			location: location as any
		})
	};
	await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const post = await new Post(model).save({ session });
		await User.findOneAndUpdate(
			{
				_id: userId
			},
			{
				$addToSet: {
					posts: post._id
				}
			}
		).session(session);
		reply.status(201).send({ post });
	});
	await session.endSession();
};
export const updatePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { content = "" } = request.body as PostUpdateBody;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		if (!content.trim()) {
			reply.status(400).send("No content");
			return;
		}
		const post = await findPostById(postId);
		if (!post) {
			reply.status(404).send("Post not found");
			return;
		}
		if (post.author !== userId) {
			reply.status(403).send("You are not allowed to perform this action");
			return;
		}
		if (post.__v > 0) {
			reply.status(422).send("Post was edited once and cannot be edited again");
			return;
		}
		const { poll, mediaFile, post: quotedPostId } = post.attachments as AttachmentsModel;
		if (poll) {
			reply.status(422).send("Cannot edit a post that includes a poll");
			return;
		}
		if (post.content === content) {
			reply.status(304).send({ post });
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = post._id;
			const postFilter = { post: originalPostId };
			const repliedPostId = post.replyTo;
			const mentions: Array<string | ObjectId> = [];
			if (repliedPostId) {
				mentions.push(((await Post.findById(repliedPostId))?.author as ObjectId) || nullId);
			}
			if (quotedPostId) {
				mentions.push(((await Post.findById(quotedPostId))?.author as ObjectId) || nullId);
			}
			const model = {
				content,
				...(mediaFile && {
					attachments: {
						mediaFile: {
							description: mediaFile.description
						}
					}
				}),
				mentions: mentions as Array<any>,
				score: 0,
				$inc: { __v: 1 }
			};
			await Promise.all([updateLanguages(model), updateMentionsAndHashtags(content, model)]);
			delete model.attachments;
			const updated = await Post.findByIdAndUpdate(originalPostId, model, { new: true }).session(session);
			await Promise.all([
				Post.updateMany({ "attachments.post": originalPostId }, { "attachments.post": nullId }).session(session),
				Post.updateMany({ replyTo: originalPostId }, { replyTo: nullId }).session(session),
				Post.deleteMany({
					repeatPost: originalPostId
				}).session(session),
				Favourite.deleteMany(postFilter).session(session),
				Bookmark.deleteMany(postFilter).session(session)
			]);
			reply.status(200).send({ updated });
		});
	} finally {
		await session.endSession();
	}
};
export const getPost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const originalPost = await findPostById(postId);
	if (!originalPost) {
		reply.status(404).send("Post not found");
		return;
	}
	const post = (
		await Post.aggregate([
			{
				$match: {
					_id: new ObjectId(originalPost._id)
				}
			},
			...postAggregationPipeline((request.userInfo as UserInfo)?.userId)
		])
	).shift();
	reply.status(200).send({ post });
};
export const getPostQuotes: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { lastQuoteId } = request.query as PostQuotesQueryString;
	const post = await findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	const quotes = await Post.aggregate(postQuotesAggregationPipeline(post._id, (request.userInfo as UserInfo)?.userId, lastQuoteId));
	reply.status(200).send({ quotes });
};
export const getPostReplies: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { lastReplyId } = request.query as PostRepliesQueryString;
	const post = await findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	const replies = await Post.aggregate(postRepliesAggregationPipeline(post._id, (request.userInfo as UserInfo)?.userId, lastReplyId));
	reply.status(200).send({ replies });
};
export const getPostParent: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const post = await findPostById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	if (!post.replyTo) {
		reply.status(422).send("Post is not a reply");
		return;
	}
	const parent = (await Post.aggregate(postParentAggregationPipeline(post._id, (request.userInfo as UserInfo)?.userId))).shift();
	reply.status(200).send({ parent });
};
export const quotePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { content = "", poll, "media-description": mediaDescription, location } = request.body as PostCreateBody;
	const { file: media, fileType } = request;
	const userId = (request.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media, postId);
	} catch (err: any) {
		reply.status(400).send(err);
		return;
	}
	const session = await mongoose.startSession();
	try {
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			reply.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = originalPost._id;
			const model = {
				content,
				author: userId as any,
				attachments: {
					...(poll && { poll }),
					...(media && {
						mediaFile: {
							fileType: fileType as any,
							src: (await uploadFile(media, fileType as string)).secure_url as any,
							previewSrc: undefined,
							description: mediaDescription
						}
					}),
					post: originalPostId as any
				},
				languages: originalPost.languages,
				...(location && {
					location: location as any
				}),
				mentions: [originalPost.author as any]
			};
			await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
			const quote = await new Post(model).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					$addToSet: {
						posts: quote._id
					}
				}
			).session(session);
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: quoteScore
				}
			}).session(session);
			reply.status(201).send({ quote });
		});
	} finally {
		await session.endSession();
	}
};
export const repeatPost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			reply.status(404).send("Post not found");
			return;
		}
		const originalPostId = originalPost._id;
		const payload = {
			author: userId,
			repeatPost: originalPostId
		};
		await session.withTransaction(async () => {
			const postToDelete = await Post.findOne(payload);
			if (postToDelete) {
				await Post.findByIdAndDelete(postToDelete._id).session(session);
			}
			const repeated = await new Post(payload).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					...(postToDelete
						? {
								$pull: {
									posts: null
								}
						  }
						: {}),
					$addToSet: {
						posts: repeated._id
					}
				}
			).session(session);
			if (!postToDelete) {
				await Post.findByIdAndUpdate(originalPostId, {
					$inc: {
						score: repeatScore
					}
				}).session(session);
			}
			reply.status(201).send({ repeated });
		});
	} finally {
		await session.endSession();
	}
};
export const unrepeatPost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unrepeated = await Post.findOneAndDelete({
				author: userId,
				repeatPost: postId
			}).session(session);
			if (unrepeated) {
				await User.findOneAndUpdate(
					{
						_id: userId
					},
					{
						$pull: {
							posts: unrepeated._id
						}
					}
				).session(session);
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: -repeatScore
					}
				}).session(session);
			}
			reply.status(200).send({ unrepeated });
		});
	} finally {
		await session.endSession();
	}
};
export const replyToPost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { content = "", poll, "media-description": mediaDescription, location } = request.body as PostCreateBody;
	const { file: media, fileType } = request;
	const userId = (request.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media);
	} catch (err: any) {
		reply.status(400).send(err);
		return;
	}
	const session = await mongoose.startSession();
	try {
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			reply.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = originalPost._id;
			const model = {
				content,
				author: userId as any,
				replyTo: originalPostId as any,
				...((poll || media) && {
					attachments: {
						...(poll && { poll }),
						...(media && {
							mediaFile: {
								fileType: fileType as any,
								src: (await uploadFile(media, fileType as string)).secure_url as any,
								previewSrc: undefined,
								description: mediaDescription
							}
						})
					}
				}),
				...(location && {
					location: location as any
				}),
				mentions: [originalPost.author as any]
			};
			await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
			const replyPost = await new Post(model).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					$addToSet: {
						posts: replyPost._id
					}
				}
			).session(session);
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: replyScore
				}
			}).session(session);
			reply.status(201).send({ reply: replyPost });
		});
	} finally {
		await session.endSession();
	}
};
export const castVote: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const { option } = request.query as PostVoteQueryString;
	const userId = (request.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const post = await findPostById(postId);
		if (!post) {
			reply.status(404).send("Post not found");
			return;
		}
		const poll = post.attachments?.poll as HydratedDocument<PollModel> & Dictionary;
		if (!poll) {
			reply.status(422).send("Post does not include a poll");
			return;
		}
		const isOptionNota = option === "nota";
		if (!(isOptionNota || poll[option])) {
			reply.status(422).send("Poll does not include the specified option");
			return;
		}
		if (post.author === userId) {
			reply.status(403).send("User cannot vote on their own poll");
			return;
		}
		const pollExpiryDate = (post as Dictionary).createdAt;
		pollExpiryDate.setMilliseconds(pollExpiryDate.getMilliseconds() + poll.duration);
		if (new Date() > pollExpiryDate) {
			reply.status(422).send("Poll has expired");
			return;
		}
		await session.withTransaction(async () => {
			const vote = await new Vote({
				poll: poll._id,
				user: userId,
				option
			}).save({ session });
			if (!isOptionNota) {
				await Post.findByIdAndUpdate(post._id, {
					$inc: {
						[`poll.votes.${option}`]: 1,
						score: voteScore
					}
				}).session(session);
			}
			reply.status(201).send({ vote });
		});
	} finally {
		await session.endSession();
	}
};
export const deletePost: RouteHandlerMethod = async (request, reply) => {
	const { postId } = request.params as PostInteractParams;
	const userId = (request.userInfo as UserInfo).userId;
	const post = await Post.findById(postId);
	if (!post) {
		reply.status(404).send("Post not found");
		return;
	}
	if (post.author.toString() !== userId) {
		reply.status(403).send("You are not allowed to perform this action");
		return;
	}
	await deletePostWithCascade(post);
	reply.status(200).send({ deleted: post });
};