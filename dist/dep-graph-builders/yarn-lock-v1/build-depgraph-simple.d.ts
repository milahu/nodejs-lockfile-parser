import type { Yarn1DepGraphBuildOptions } from '../types.js';
import type { NormalisedPkgs, PackageJsonBase } from '../types.js';
export declare const buildDepGraphYarnLockV1Simple: (extractedYarnLockV1Pkgs: NormalisedPkgs, pkgJson: PackageJsonBase, options: Yarn1DepGraphBuildOptions) => Promise<import("@snyk/dep-graph").DepGraph>;
