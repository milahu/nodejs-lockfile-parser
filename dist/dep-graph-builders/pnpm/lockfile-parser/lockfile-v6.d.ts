import { PnpmWorkspaceArgs } from '../../types.js';
import { ParsedDepPath, PnpmDeps, PnpmImporters } from '../types.js';
import { PnpmLockfileParser } from './lockfile-parser.js';
export declare class LockfileV6Parser extends PnpmLockfileParser {
    settings: any;
    constructor(rawPnpmLock: any, workspaceArgs?: PnpmWorkspaceArgs);
    parseDepPath(depPath: string): ParsedDepPath;
    normalizeTopLevelDeps(dependencies: Record<string, Record<string, string>>, isDev: boolean, importerName?: string): PnpmDeps;
    normalizePackagesDeps(dependencies: Record<string, Record<string, string>>, isDev: boolean, importerName?: string): Record<string, string>;
    excludeTransPeerDepsVersions(fullVersionStr: string): string;
    static isAbsoluteDepenencyPath(dependencyPath: string): boolean;
    normaliseImporters(rawPnpmLock: any): PnpmImporters;
}
