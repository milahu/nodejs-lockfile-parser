import { PnpmProjectParseOptions } from '../types.js';
import { DepGraph } from '@snyk/dep-graph';
import { NodeLockfileVersion } from '../../utils.js';
export declare const parsePnpmWorkspaceProject: (pkgJsonContent: string, pnpmLockfileContents: string, options: PnpmProjectParseOptions, importer: string, lockfileVersion?: NodeLockfileVersion) => Promise<DepGraph>;
