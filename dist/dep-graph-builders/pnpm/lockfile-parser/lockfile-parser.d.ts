import { PnpmWorkspaceArgs } from '../../types.js';
import { NormalisedPnpmPkgs, ParsedDepPath, PnpmDepPath, PnpmDeps, PnpmImporters, PnpmLockPkg } from '../types.js';
export declare abstract class PnpmLockfileParser {
    lockFileVersion: string;
    rawPnpmLock: any;
    packages: Record<PnpmDepPath, PnpmLockPkg>;
    dependencies: Record<string, any>;
    devDependencies: Record<string, any>;
    optionalDependencies: Record<string, any>;
    peerDependencies: Record<string, any>;
    extractedPackages: NormalisedPnpmPkgs;
    importers: PnpmImporters;
    workspaceArgs?: PnpmWorkspaceArgs;
    constructor(rawPnpmLock: any, workspaceArgs?: PnpmWorkspaceArgs);
    isWorkspaceLockfile(): boolean | undefined;
    getRoot(rawPnpmLock: any): any;
    extractPackages(): NormalisedPnpmPkgs;
    extractTopLevelDependencies(options: {
        includeDevDeps: boolean;
        includeOptionalDeps?: boolean;
        includePeerDeps?: boolean;
    }): PnpmDeps;
    normalizeVersion(name: string, version: string, isDev: boolean): string;
    resolveWorkspacesCrossReference(name: string, version: string, isDev: boolean): string;
    abstract normalizePackagesDeps(dependencies: any, isDev: any): Record<string, string>;
    abstract normalizeTopLevelDeps(dependencies: any, isDev: any): PnpmDeps;
    abstract parseDepPath(depPath: string): ParsedDepPath;
    abstract excludeTransPeerDepsVersions(fullVersionStr: string): string;
    abstract normaliseImporters(rawPnpmLock: any): PnpmImporters;
}
