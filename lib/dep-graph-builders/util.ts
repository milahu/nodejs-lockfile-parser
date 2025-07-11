import { PackageJsonBase } from './types.js';
import { DepGraphBuilder } from '@snyk/dep-graph';
import { InvalidUserInputError } from '../errors/index.js';
import { NormalisedPkgs } from './types.js';
import { OutOfSyncError } from '../errors/index.js';
import { LockfileType } from '../parsers/index.js';

export type Dependencies = Record<string, { version: string; isDev: boolean }>;

export interface PkgNode {
  id: string;
  name: string;
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies: Dependencies;
  isDev: boolean;
  missingLockFileEntry?: boolean;
  inBundle?: boolean;
  key?: string;
}

export const addPkgNodeToGraph = (
  depGraphBuilder: DepGraphBuilder,
  node: PkgNode,
  options: {
    isCyclic?: boolean;
    isWorkspacePkg?: boolean;
  },
): DepGraphBuilder => {
  return depGraphBuilder.addPkgNode(
    { name: node.name, version: node.version },
    node.id,
    {
      labels: {
        scope: node.isDev ? 'dev' : 'prod',
        ...(options.isCyclic && { pruned: 'cyclic' }),
        ...(options.isWorkspacePkg && { pruned: 'true' }),
        ...(node.missingLockFileEntry && { missingLockFileEntry: 'true' }),
        resolved: node.resolved,
        integrity: node.integrity,
      },
    },
  );
};

/**
 * Get top level dependencies from the given package json object which is parsed from a package.json file.
 * This includes both prod dependencies and dev dependencies supposing includeDevDeps is supported.
 */
export const getTopLevelDeps = (
  pkgJson: PackageJsonBase,
  options: {
    includeDevDeps: boolean;
    includeOptionalDeps?: boolean;
    includePeerDeps?: boolean;
  },
): Dependencies => {
  const prodDeps = getGraphDependencies(pkgJson.dependencies || {}, false);

  const devDeps = getGraphDependencies(pkgJson.devDependencies || {}, true);

  const optionalDeps = options.includeOptionalDeps
    ? getGraphDependencies(pkgJson.optionalDependencies || {}, false)
    : {};

  const peerDeps = options.includePeerDeps
    ? getGraphDependencies(pkgJson.peerDependencies || {}, false)
    : {};

  const deps = { ...prodDeps, ...optionalDeps, ...peerDeps };

  if (options.includeDevDeps) {
    // Ensure dev dependency 'isDev' flags are correctly set.
    // Dev dependencies are applied last to override shared keys with regular dependencies.
    return { ...deps, ...devDeps };
  }

  // For includeDevDeps option set to false, simulate pnpm install --prod
  // by excluding all devDependencies,
  // ignoring potential duplicates in other dependency lists.
  // https://pnpm.io/cli/install#--prod--p
  return Object.keys(deps)
    .filter((packageName) => !devDeps.hasOwnProperty(packageName))
    .reduce((result, packageName) => {
      result[packageName] = deps[packageName];
      return result;
    }, {});
};

/**
 * Converts dependencies parsed from the a lock file to a dependencies object required by the graph.
 * For example, { 'mime-db': '~1.12.0' } will be converted to { 'mime-db': { version: '~1.12.0', isDev: true/false } }.
 */
export const getGraphDependencies = (
  dependencies: Record<string, string>,
  isDev,
): Dependencies => {
  return Object.entries(dependencies).reduce(
    (pnpmDeps: Dependencies, [name, semver]) => {
      pnpmDeps[name] = { version: semver, isDev: isDev };
      return pnpmDeps;
    },
    {},
  );
};

export function parsePkgJson(pkgJsonContent: string): PackageJsonBase {
  try {
    const parsedPkgJson = JSON.parse(pkgJsonContent);
    if (!parsedPkgJson.name) {
      parsedPkgJson.name = 'package.json';
    }
    return parsedPkgJson;
  } catch (e) {
    throw new InvalidUserInputError(
      'package.json parsing failed with error ' + (e as Error).message,
    );
  }
}

export const getChildNode = (
  name: string,
  depInfo: { version: string; isDev: boolean },
  pkgs: NormalisedPkgs,
  strictOutOfSync: boolean,
  includeOptionalDeps: boolean,
) => {
  const childNodeKey = `${name}@${depInfo.version}`;
  let childNode: PkgNode;

  if (!pkgs[childNodeKey]) {
    if (strictOutOfSync && !/^file:/.test(depInfo.version)) {
      throw new OutOfSyncError(childNodeKey, LockfileType.yarn);
    } else {
      childNode = {
        id: childNodeKey,
        name: name,
        version: depInfo.version,
        resolved: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
        integrity: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
        dependencies: {},
        isDev: depInfo.isDev,
        missingLockFileEntry: true,
      };
    }
  } else {
    const depData = pkgs[childNodeKey];
    const dependencies = getGraphDependencies(
      depData.dependencies || {},
      depInfo.isDev,
    );
    const optionalDependencies = includeOptionalDeps
      ? getGraphDependencies(depData.optionalDependencies || {}, depInfo.isDev)
      : {};
    childNode = {
      id: `${name}@${depData.version}`,
      name: name,
      version: depData.version,
      resolved: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
      integrity: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
      dependencies: { ...dependencies, ...optionalDependencies },
      isDev: depInfo.isDev,
    };
  }

  return childNode;
};
