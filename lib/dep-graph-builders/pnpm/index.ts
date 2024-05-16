import { parsePkgJson } from '../util.js';
import {
  PackageJsonBase,
  PnpmProjectParseOptions,
  PnpmWorkspaceArgs,
} from '../types.js';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.js';
import { DepGraph } from '@snyk/dep-graph';
import { getPnpmLockfileParser } from './lockfile-parser/index.js';
import { PnpmLockfileParser } from './lockfile-parser/lockfile-parser.js';
import { NodeLockfileVersion } from '../../utils.js';

export const parsePnpmProject = async (
  pkgJsonContent: string,
  pnpmLockContent: string,
  options: PnpmProjectParseOptions,
  lockfileVersion?: NodeLockfileVersion,
  workspaceArgs?: PnpmWorkspaceArgs,
): Promise<DepGraph> => {
  const {
    includeDevDeps,
    includeOptionalDeps,
    strictOutOfSync,
    pruneWithinTopLevelDeps,
  } = options;

  const pkgJson: PackageJsonBase = parsePkgJson(pkgJsonContent);

  const lockFileParser: PnpmLockfileParser = getPnpmLockfileParser(
    pnpmLockContent,
    lockfileVersion,
    workspaceArgs,
  );

  const depgraph = await buildDepGraphPnpm(
    lockFileParser,
    pkgJson,
    {
      includeDevDeps,
      strictOutOfSync,
      includeOptionalDeps,
      pruneWithinTopLevelDeps,
    },
    workspaceArgs,
  );

  return depgraph;
};
