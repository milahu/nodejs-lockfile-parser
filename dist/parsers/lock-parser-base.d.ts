import { Dep, DepTreeDep, Lockfile, LockfileParser, LockfileType, ManifestDependencies, ManifestFile, PkgTree } from './index.js';
export interface PackageLockDeps {
    [depName: string]: PackageLockDep;
}
export interface PackageLockDep {
    version: string;
    requires?: {
        [depName: string]: string;
    };
    resolved?: string;
    integrity?: string;
    dependencies?: PackageLockDeps;
    dev?: boolean;
}
export interface DepMap {
    [path: string]: DepMapItem;
}
export interface DepMapItem extends DepTreeDep {
    requires: string[];
}
export declare abstract class LockParserBase implements LockfileParser {
    protected type: LockfileType;
    protected treeSizeLimit: number;
    protected pathDelimiter: string;
    constructor(type: LockfileType, treeSizeLimit: number);
    abstract parseLockFile(lockFileContents: string): Lockfile;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean): Promise<PkgTree>;
    private setDevDepRec;
    private removeCycle;
    private cloneAcyclicNodeEdges;
    private cloneNodeWithoutEdges;
    private createGraphOfDependencies;
    private findDepsPath;
    private createDepTrees;
    protected getDepMap(lockfile: Lockfile, // eslint-disable-line @typescript-eslint/no-unused-vars
    resolutions?: ManifestDependencies): DepMap;
    protected getDepTreeKey(dep: Dep): string;
}
