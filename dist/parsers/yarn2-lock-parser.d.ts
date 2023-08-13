import { LockParserBase, DepMap } from './lock-parser-base.js';
import { Dep, Lockfile, LockfileType, ManifestDependencies, ManifestFile, PkgTree } from './index.js';
export interface Yarn2Lock {
    type: string;
    object: Yarn2LockDeps;
    dependencies?: Yarn2LockDeps;
    lockfileType: LockfileType.yarn2;
}
export interface Yarn2LockDeps {
    [depName: string]: Yarn2LockDep;
}
export interface Yarn2LockDep {
    version: string;
    resolution?: string;
    checksum?: string;
    linkType?: string;
    languageName?: string;
    dependencies?: {
        [depName: string]: string;
    };
    optionalDependencies?: {
        [depName: string]: string;
    };
}
export declare class Yarn2LockParser extends LockParserBase {
    constructor();
    parseLockFile(lockFileContents: string): Yarn2Lock;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
    protected getDepMap(lockfile: Lockfile, resolutions?: ManifestDependencies): DepMap;
    protected getDepTreeKey(dep: Dep): string;
}
