declare global {
	type DeepPartial<T> = T extends object
		? {
				[P in keyof T]?: DeepPartial<T[P]>;
		  }
		: T;
	type Dictionary = {
		[key: string]: any;
	};
	type UserInfo = {
		handle: string;
		userId: string | ObjectId;
	};
}

export {};