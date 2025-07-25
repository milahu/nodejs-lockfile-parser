import { PackageLock } from './package-lock-parser.js';
import { YarnLock } from './yarn-lock-parser.js';
import { Yarn2Lock } from './yarn2-lock-parser.js';
export interface Dep {
    name: string;
    version: string;
    dev?: boolean;
}
interface WorkspacesAlternateConfig {
    packages?: string[];
}
export type ManifestDependencies = {
    [dep: string]: string;
};
export type PeerDependenciesMeta = {
    [dep: string]: {
        optional: boolean;
    };
};
export interface ManifestFile {
    name: string;
    private?: string;
    engines?: {
        node?: string;
    };
    workspaces?: string[] | WorkspacesAlternateConfig;
    dependencies?: ManifestDependencies;
    devDependencies?: ManifestDependencies;
    optionalDependencies?: ManifestDependencies;
    peerDependencies?: ManifestDependencies;
    peerDependenciesMeta?: PeerDependenciesMeta;
    resolutions?: ManifestDependencies;
    version?: string;
}
export interface DepTreeDep {
    name?: string;
    version?: string;
    resolved?: string;
    integrity?: string;
    resolution?: string;
    checksum?: string;
    dependencies?: {
        [depName: string]: DepTreeDep;
    };
    labels?: {
        [key: string]: string | undefined;
        scope?: 'dev' | 'prod';
        pruned?: 'cyclic' | 'true';
        missingLockFileEntry?: 'true';
    };
}
export interface PkgTree extends DepTreeDep {
    type?: string;
    packageFormatVersion?: string;
    dependencies: {
        [depName: string]: DepTreeDep;
    };
    meta?: {
        nodeVersion?: string;
        lockfileVersion?: number;
        packageManager?: string;
    };
    hasDevDependencies?: boolean;
    cyclic?: boolean;
    size?: number;
}
export declare enum Scope {
    prod = "prod",
    dev = "dev"
}
export declare enum LockfileType {
    npm = "npm",
    npm7 = "npm7",
    yarn = "yarn",
    yarn2 = "yarn2",
    pnpm = "pnpm"
}
export interface LockfileParser {
    parseLockFile: (lockFileContents: string) => Lockfile;
    getDependencyTree: (manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strictOutOfSync?: boolean) => Promise<PkgTree>;
}
export type Lockfile = PackageLock | YarnLock | Yarn2Lock;
export declare function parseManifestFile(manifestFileContents: string): ManifestFile;
export declare function getTopLevelDeps({ targetFile, includeDev, includePeerDeps, applyYarn2Resolutions, }: {
    targetFile: ManifestFile;
    includeDev: boolean;
    includePeerDeps?: boolean;
    applyYarn2Resolutions?: boolean;
}): Dep[];
export declare function createDepTreeDepFromDep(dep: Dep): DepTreeDep;
export declare function getYarnWorkspaces(targetFile: string): string[] | false;
export declare function getPnpmWorkspaces(workspacesYamlFile: string): string[];
export {};
