import type { PnpmProjectParseOptions } from '../types.js';
import type { PackageJsonBase } from '../types.js';
import { PnpmLockfileParser } from './lockfile-parser/lockfile-parser.js';
export declare const buildDepGraphPnpm: (lockFileParser: PnpmLockfileParser, pkgJson: PackageJsonBase, options: PnpmProjectParseOptions, importer?: string) => Promise<import("@snyk/dep-graph").DepGraph>;
