"use strict";

import type { FormzillaFile } from "formzilla";

declare module "formzilla" {
	interface FormzillaFile {
		type?: string;
		subType?: string;
	}
}