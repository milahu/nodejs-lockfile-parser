import { Dep, Lockfile, LockfileType, ManifestFile, PkgTree } from './index.js';
import { DepMap, LockParserBase } from './lock-parser-base.js';
export type YarnLockFileTypes = LockfileType.yarn | LockfileType.yarn2;
export interface YarnLock {
    type: string;
    object: YarnLockDeps;
    dependencies?: YarnLockDeps;
    lockfileType: YarnLockFileTypes;
}
export interface YarnLockDeps {
    [depName: string]: YarnLockDep;
}
export interface YarnLockDep {
    version: string;
    resolved?: string;
    integrity?: string;
    dependencies?: {
        [depName: string]: string;
    };
    optionalDependencies?: {
        [depName: string]: string;
    };
}
export declare class YarnLockParser extends LockParserBase {
    constructor();
    parseLockFile(lockFileContents: string): YarnLock;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
    protected getDepMap(lockfile: Lockfile): DepMap;
    protected getDepTreeKey(dep: Dep): string;
}
