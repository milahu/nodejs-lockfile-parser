import { DepGraphBuildOptions, PackageJsonBase, ProjectParseOptions } from '../types.js';
import { extractPkgsFromNpmLockV2 } from './extract-npm-lock-v2-pkgs.js';
import type { NpmLockPkg } from './extract-npm-lock-v2-pkgs.js';
import { DepGraph } from '@snyk/dep-graph';
export { extractPkgsFromNpmLockV2 };
export declare const parseNpmLockV2Project: (pkgJsonContent: string, pkgLockContent: string, options: ProjectParseOptions) => Promise<DepGraph>;
export declare const buildDepGraphNpmLockV2: (npmLockPkgs: Record<string, NpmLockPkg>, pkgJson: PackageJsonBase, options: DepGraphBuildOptions) => Promise<DepGraph>;
export declare const getChildNodeKey: (name: string, version: string, ancestry: {
    name: string;
    key: string;
    inBundle: boolean;
}[], pkgs: Record<string, NpmLockPkg>, pkgKeysByName: Map<string, string[]>) => string | undefined;
