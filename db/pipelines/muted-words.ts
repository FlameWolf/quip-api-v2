"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";

const mutedWordsAggregationPipeline = (userId: string | ObjectId, lastMuteId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			mutedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$project: {
			word: 1,
			match: 1
		}
	},
	{
		$match: lastMuteId
			? {
					_id: {
						$lt: new ObjectId(lastMuteId)
					}
			  }
			: {
					$expr: true
			  }
	},
	{
		$limit: maxRowsPerFetch
	}
];

export default mutedWordsAggregationPipeline;