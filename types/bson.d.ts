"use strict";

declare module "bson" {
	declare class ObjectId {
		_id: this;
		constructor(param: any = undefined) {
			return param ? new ObjectId() : ObjectId.createFromHexString(param);
		}
	}
}