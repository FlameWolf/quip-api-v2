"use strict";

import { ObjectId } from "bson";

const mutedWordsAggregationPipeline = (userId: string | ObjectId, lastMuteId?: string | ObjectId): Array<any> => [
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
		project: {
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
		$limit: 20
	}
];

export default mutedWordsAggregationPipeline;