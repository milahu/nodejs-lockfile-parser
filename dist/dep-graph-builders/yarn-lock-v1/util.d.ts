import { NormalisedPkgs } from '../types.js';
import { PkgNode } from '../util.js';
export declare const getChildNodeYarnLockV1Workspace: (name: string, depInfo: {
    version: string;
    isDev: boolean;
}, workspacePkgNameToVersion: Record<string, string>, pkgs: NormalisedPkgs, strictOutOfSync: boolean, includeOptionalDeps: boolean) => PkgNode;
