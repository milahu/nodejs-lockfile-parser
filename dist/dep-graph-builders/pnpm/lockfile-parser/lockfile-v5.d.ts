import { ParsedDepPath, PnpmDeps, PnpmImporters } from '../types.js';
import { PnpmLockfileParser } from './lockfile-parser.js';
import { PnpmWorkspaceArgs } from '../../types.js';
export declare class LockfileV5Parser extends PnpmLockfileParser {
    specifiers: Record<string, string>;
    constructor(rawPnpmLock: any, workspaceArgs?: PnpmWorkspaceArgs);
    parseDepPath(depPath: string): ParsedDepPath;
    normalizeTopLevelDeps(dependencies: Record<string, string>, isDev: boolean): PnpmDeps;
    normalizePackagesDeps(dependencies: Record<string, string>, isDev: boolean): Record<string, string>;
    excludeTransPeerDepsVersions(fullVersionStr: string): string;
    normaliseImporters(rawPnpmLock: any): PnpmImporters;
}
