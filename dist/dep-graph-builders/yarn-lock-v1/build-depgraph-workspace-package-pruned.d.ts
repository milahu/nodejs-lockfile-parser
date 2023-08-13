import type { NormalisedPkgs, PackageJsonBase } from '../types.js';
import type { DepGraphBuildOptions } from '../types.js';
export declare const buildDepGraphYarnLockV1WorkspaceCyclesPruned: (extractedYarnLockV1Pkgs: NormalisedPkgs, pkgJson: PackageJsonBase, workspacePkgNameToVersion: Record<string, string>, options: DepGraphBuildOptions) => Promise<import("@snyk/dep-graph").DepGraph>;
