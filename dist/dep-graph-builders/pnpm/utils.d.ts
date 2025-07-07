import { PnpmLockfileParser } from './lockfile-parser/lockfile-parser.js';
import { NormalisedPnpmPkgs, PnpmNode } from './types.js';
export declare const getPnpmChildNode: (name: string, depInfo: {
    version: string;
    isDev: boolean;
}, pkgs: NormalisedPnpmPkgs, strictOutOfSync: boolean, includeOptionalDeps: boolean, includeDevDeps: boolean, lockfileParser: PnpmLockfileParser) => PnpmNode;
export declare function getFileContents(root: string, fileName: string): {
    content: string;
    fileName: string;
};
