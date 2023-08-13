import type { NormalisedPkgs, PackageJsonBase } from '../types.js';
import type { DepGraphBuildOptions } from '../types.js';
export declare const buildDepGraphYarnLockV1SimpleCyclesPruned: (extractedYarnLockV1Pkgs: NormalisedPkgs, pkgJson: PackageJsonBase, options: DepGraphBuildOptions) => Promise<import("@snyk/dep-graph").DepGraph>;
