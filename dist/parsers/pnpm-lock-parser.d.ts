import { Dep, Lockfile, LockfileType, ManifestFile, PkgTree } from './index';
import { DepMap, LockParserBase } from './lock-parser-base';
export interface PackageLock {
    name: string;
    version: string;
    dependencies?: PackageLockDeps;
    lockfileVersion: 1 | 2;
    type: LockfileType.npm | LockfileType.npm7;
}
export interface PackageLockDeps {
    [depName: string]: PackageLockDep;
}
export interface PackageLockDep {
    version: string;
    requires?: {
        [depName: string]: string;
    };
    dependencies?: PackageLockDeps;
    dev?: boolean;
}
export declare class PackageLockParser extends LockParserBase {
    constructor();
    parseLockFile(lockFileContents: string): PackageLock;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
    protected getDepMap(lockfile: Lockfile): DepMap;
    protected getDepTreeKey(dep: Dep): string;
}
