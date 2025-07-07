import { PnpmWorkspaceArgs } from '../../types.js';
import { NormalisedPnpmPkg, NormalisedPnpmPkgs, ParsedDepPath, PnpmDepPath, PnpmDeps, PnpmImporters, PnpmLockPkg } from '../types.js';
export declare abstract class PnpmLockfileParser {
    lockFileVersion: string;
    rawPnpmLock: any;
    packages: Record<PnpmDepPath, PnpmLockPkg>;
    extractedPackages: NormalisedPnpmPkgs;
    importers: PnpmImporters;
    workspaceArgs?: PnpmWorkspaceArgs;
    resolvedPackages: Record<string, PnpmDepPath>;
    constructor(rawPnpmLock: any, workspaceArgs?: PnpmWorkspaceArgs);
    isWorkspaceLockfile(): boolean | undefined;
    extractPackages(): NormalisedPnpmPkgs;
    extractTopLevelDependencies(options: {
        includeDevDeps: boolean;
        includeOptionalDeps?: boolean;
        includePeerDeps?: boolean;
    }, importer?: string): PnpmDeps;
    normalizedPkgToTopLevel(pkg: NormalisedPnpmPkg): PnpmDeps;
    topLevelDepsToNormalizedPkgs(deps: PnpmDeps): Record<string, string>;
    normalizeVersion(name: string, version: string, isDev: boolean, importerName?: string): string;
    resolveWorkspacesCrossReference(name: string, version: string, isDev: boolean, importerName?: string): string;
    abstract normalizePackagesDeps(dependencies: any, isDev: any, importerName?: any): Record<string, string>;
    abstract normalizeTopLevelDeps(dependencies: any, isDev: any, importerName?: any): PnpmDeps;
    abstract parseDepPath(depPath: string): ParsedDepPath;
    abstract excludeTransPeerDepsVersions(fullVersionStr: string): string;
    abstract normaliseImporters(rawPnpmLock: any): PnpmImporters;
}
