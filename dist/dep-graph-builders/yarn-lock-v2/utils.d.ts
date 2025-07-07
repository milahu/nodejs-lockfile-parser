import { structUtils } from '@yarnpkg/core';
import { NormalisedPkgs } from '../types.js';
import { PkgNode } from '../util.js';
export type ParseDescriptor = typeof structUtils.parseDescriptor;
export type ParseRange = typeof structUtils.parseRange;
export type YarnLockFileKeyNormalizer = (fullDescriptor: string) => Set<string>;
export declare const yarnLockFileKeyNormalizer: (parseDescriptor: ParseDescriptor, parseRange: ParseRange) => YarnLockFileKeyNormalizer;
export declare const getYarnLockV2ChildNode: (name: string, depInfo: {
    version: string;
    isDev: boolean;
}, pkgs: NormalisedPkgs, strictOutOfSync: boolean, includeOptionalDeps: boolean, resolutions: Record<string, string>, parentNode: PkgNode) => {
    id: string;
    name: string;
    version: string;
    dependencies: {};
    isDev: boolean;
    missingLockFileEntry: boolean;
    resolved?: undefined;
    integrity?: undefined;
} | {
    id: string;
    name: string;
    version: string;
    resolved: string;
    integrity: string;
    dependencies: {
        [x: string]: {
            version: string;
            isDev: boolean;
        };
    };
    isDev: boolean;
    missingLockFileEntry?: undefined;
} | {
    id: string;
    name: string;
    version: string;
    resolved: string;
    integrity: string;
    dependencies: {};
    isDev: boolean;
    missingLockFileEntry: boolean;
};
