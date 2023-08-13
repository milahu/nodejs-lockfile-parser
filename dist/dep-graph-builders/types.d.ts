export declare type PackageJsonBase = {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    resolutions?: Record<string, string>;
};
export declare type PkgIdentifier = string;
export declare type NormalisedPkgs = Record<PkgIdentifier, {
    version: string;
    dependencies: Record<string, string>;
    optionalDependencies: Record<string, string>;
}>;
export declare type DepGraphBuildOptions = {
    includeDevDeps: boolean;
    includeOptionalDeps: boolean;
    strictOutOfSync: boolean;
    includePeerDeps?: boolean;
};
export declare type LockFileParseOptions = {
    includeOptionalDeps: boolean;
};
export declare type ProjectParseOptions = DepGraphBuildOptions & LockFileParseOptions & {
    pruneCycles: boolean;
};
export declare type YarnLockV2WorkspaceArgs = {
    isWorkspacePkg: boolean;
    isRoot: boolean;
    rootResolutions: Record<string, string>;
};
export declare type YarnLockV2ProjectParseOptions = {
    includeDevDeps: boolean;
    includeOptionalDeps: boolean;
    strictOutOfSync: boolean;
    pruneWithinTopLevelDeps: boolean;
};
export declare type PruneLevel = 'cycles' | 'withinTopLevelDeps' | 'none';
export declare type YarnLockV1ProjectParseOptions = {
    includeDevDeps: boolean;
    includeOptionalDeps: boolean;
    includePeerDeps: boolean;
    strictOutOfSync: boolean;
    pruneLevel: PruneLevel;
};
export declare type Yarn1DepGraphBuildOptions = {
    includeDevDeps: boolean;
    includeOptionalDeps: boolean;
    includePeerDeps: boolean;
    strictOutOfSync: boolean;
    pruneWithinTopLevelDeps: boolean;
};
