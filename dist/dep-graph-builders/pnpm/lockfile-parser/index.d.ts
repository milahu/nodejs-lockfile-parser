import { PnpmLockfileParser } from './lockfile-parser.js';
import { PnpmWorkspaceArgs } from '../../types.js';
import { NodeLockfileVersion } from '../../../utils.js';
export declare function getPnpmLockfileParser(pnpmLockContent: string, lockfileVersion?: NodeLockfileVersion, workspaceArgs?: PnpmWorkspaceArgs): PnpmLockfileParser;
