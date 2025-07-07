import { PnpmProjectParseOptions } from '../types.js';
import { DepGraph } from '@snyk/dep-graph';
import { NodeLockfileVersion } from '../../utils.js';
export declare const parsePnpmProject: (pkgJsonContent: string, pnpmLockContent: string | undefined, options: PnpmProjectParseOptions, lockfileVersion?: NodeLockfileVersion) => Promise<DepGraph>;
