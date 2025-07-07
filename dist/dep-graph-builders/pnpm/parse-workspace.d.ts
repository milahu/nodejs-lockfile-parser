import { PnpmProjectParseOptions, ScannedNodeProject } from '../types.js';
export declare const parsePnpmWorkspace: (root: string, workspaceDir: string, options: PnpmProjectParseOptions) => Promise<ScannedNodeProject[]>;
