import { PnpmProjectParseOptions, PnpmWorkspaceArgs } from '../types.js';
import { DepGraph } from '@snyk/dep-graph';
import { NodeLockfileVersion } from '../../utils.js';
export declare const parsePnpmProject: (pkgJsonContent: string, pnpmLockContent: string, options: PnpmProjectParseOptions, lockfileVersion?: NodeLockfileVersion, workspaceArgs?: PnpmWorkspaceArgs) => Promise<DepGraph>;
