import { DepGraph } from '@snyk/dep-graph';
import { ProjectParseOptions } from '../types.js';
export declare const parseYarnLockV1WorkspaceProject: (yarnLockContent: string, workspacePackagesPkgJsons: string[], options: ProjectParseOptions) => Promise<DepGraph[]>;
