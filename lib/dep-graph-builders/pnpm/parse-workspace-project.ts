import { parsePkgJson } from '../util.js';
import { PackageJsonBase, PnpmProjectParseOptions } from '../types.js';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.js';
import { DepGraph } from '@snyk/dep-graph';
import { getPnpmLockfileParser } from './lockfile-parser/index.js';
import { PnpmLockfileParser } from './lockfile-parser/lockfile-parser.js';
import { NodeLockfileVersion } from '../../utils.js';
import { UNDEFINED_VERSION } from './constants.js';

export const parsePnpmWorkspaceProject = async (
  pkgJsonContent: string,
  pnpmLockfileContents: string,
  options: PnpmProjectParseOptions,
  importer: string,
  lockfileVersion?: NodeLockfileVersion,
) => {
  const {
    includeDevDeps,
    includePeerDeps,
    includeOptionalDeps,
    strictOutOfSync,
    pruneWithinTopLevelDeps,
  } = options;

  const lockFileParser: PnpmLockfileParser = getPnpmLockfileParser(
    pnpmLockfileContents,
    lockfileVersion,
  );

  const pkgJson: PackageJsonBase = parsePkgJson(pkgJsonContent);

  lockFileParser.workspaceArgs = {
    isWorkspace: true,
    projectsVersionMap: {
      [importer]: {
        name: pkgJson.name,
        version: pkgJson.version || UNDEFINED_VERSION,
      },
    },
  };
  const depGraph: DepGraph = await buildDepGraphPnpm(
    lockFileParser,
    pkgJson,
    {
      includeDevDeps,
      includePeerDeps,
      strictOutOfSync,
      includeOptionalDeps,
      pruneWithinTopLevelDeps,
    },
    importer,
  );

  return depGraph;
};
