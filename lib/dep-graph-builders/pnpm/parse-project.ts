import { parsePkgJson } from '../util.js';
import { PackageJsonBase, PnpmProjectParseOptions } from '../types.js';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.js';
import { DepGraph } from '@snyk/dep-graph';
import { getPnpmLockfileParser } from './lockfile-parser/index.js';
import { NodeLockfileVersion } from '../../utils.js';

export const parsePnpmProject = async (
  pkgJsonContent: string,
  pnpmLockContent: string | undefined,
  options: PnpmProjectParseOptions,
  lockfileVersion?: NodeLockfileVersion,
): Promise<DepGraph> => {
  const {
    includeDevDeps,
    includePeerDeps,
    includeOptionalDeps,
    strictOutOfSync,
    pruneWithinTopLevelDeps,
  } = options;
  let importer = '';

  const pkgJson: PackageJsonBase = parsePkgJson(pkgJsonContent);

  const lockFileParser = getPnpmLockfileParser(
    pnpmLockContent,
    lockfileVersion,
  );

  // Lockfile V9 simple project has the root importer
  if (lockFileParser.lockFileVersion.startsWith('9')) {
    importer = '.';
    lockFileParser.workspaceArgs = {
      projectsVersionMap: {
        '.': { name: pkgJson.name, version: pkgJson.version },
      },
      isWorkspace: true,
    };
  }

  const depgraph = await buildDepGraphPnpm(
    lockFileParser,
    pkgJson,
    {
      includeDevDeps,
      strictOutOfSync,
      includePeerDeps,
      includeOptionalDeps,
      pruneWithinTopLevelDeps,
    },
    importer,
  );

  return depgraph;
};
