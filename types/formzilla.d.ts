"use strict";

import { File } from "formzilla";

declare module "formzilla" {
	interface File {
		type: string;
		subType: string;
	}
}