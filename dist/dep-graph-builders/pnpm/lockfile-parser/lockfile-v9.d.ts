import { PnpmWorkspaceArgs } from '../../types.js';
import { LockfileV6Parser } from './lockfile-v6.js';
export declare class LockfileV9Parser extends LockfileV6Parser {
    settings: any;
    snapshots: any;
    constructor(rawPnpmLock: any, workspaceArgs?: PnpmWorkspaceArgs);
}
