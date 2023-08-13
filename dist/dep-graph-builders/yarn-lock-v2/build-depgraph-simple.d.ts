import type { YarnLockV2ProjectParseOptions, YarnLockV2WorkspaceArgs } from '../types.js';
import type { NormalisedPkgs, PackageJsonBase } from '../types.js';
export declare const buildDepGraphYarnLockV2Simple: (extractedYarnLockV2Pkgs: NormalisedPkgs, pkgJson: PackageJsonBase, options: YarnLockV2ProjectParseOptions, workspaceArgs?: YarnLockV2WorkspaceArgs) => Promise<import("@snyk/dep-graph").DepGraph>;
