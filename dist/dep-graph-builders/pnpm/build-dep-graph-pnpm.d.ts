import type { PnpmProjectParseOptions, PnpmWorkspaceArgs } from '../types.js';
import type { PackageJsonBase } from '../types.js';
import { PnpmLockfileParser } from './lockfile-parser/lockfile-parser.js';
export declare const buildDepGraphPnpm: (lockFileParser: PnpmLockfileParser, pkgJson: PackageJsonBase, options: PnpmProjectParseOptions, workspaceArgs?: PnpmWorkspaceArgs) => Promise<import("@snyk/dep-graph").DepGraph>;
