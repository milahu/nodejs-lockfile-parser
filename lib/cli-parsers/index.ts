import { DepGraph, DepGraphBuilder } from '@snyk/dep-graph';
import { getYarnLockfileType } from '../index.js';
import { LockfileType } from '../parsers/index.js';
import { FormattedCliOutput } from './cli-parser-types.js';
import { extractNameAndIdentifier } from './cli-parser-utils.js';
import { parseYarnInfoOutput } from './yarn-info-parser.js';
import { parseYarnListOutput } from './yarn-list-parser.js';

export const buildDepGraphFromCliOutput = (
  rawCliOutput: string,
  lockfileContent: string,
  manifestFileContent: string,
): DepGraph => {
  const manifestDependencies: Record<string, string> =
    JSON.parse(manifestFileContent).dependencies || {};

  const lockfileType = getYarnLockfileType(lockfileContent);

  const { name: rootName, version: rootVersion } =
    JSON.parse(manifestFileContent);

  const pkgManagerVersion: '1' | '2' =
    lockfileType === LockfileType.yarn ? '1' : '2';

  // Build depMap object from the cli output
  const formattedCliOutput: FormattedCliOutput =
    pkgManagerVersion === '1'
      ? parseYarnListOutput(rawCliOutput, manifestDependencies)
      : parseYarnInfoOutput(rawCliOutput);

  const rootPkgInfo: { name: string; version?: string } = rootName
    ? { name: rootName, ...(rootVersion && { version: rootVersion }) }
    : undefined;

  const pkgManager = {
    name: 'yarn',
    version: pkgManagerVersion,
  };

  const builder = new DepGraphBuilder(pkgManager, rootPkgInfo);

  const { topLevelDeps, dependencies: depMap } = formattedCliOutput;

  // Add all nodes
  [...depMap.keys()].forEach((name) => {
    const { name: pkgName, identifier: pkgVersion } =
      extractNameAndIdentifier(name);
    builder.addPkgNode(
      { name: pkgName, version: pkgVersion.split(':').pop() as string },
      name,
    );
  });

  // Deal with root special case first
  const rootNodeId = builder.rootNodeId;
  topLevelDeps.forEach((dep) => builder.connectDep(rootNodeId, dep));

  // Now rest of deps
  [...depMap.entries()].forEach(([parent, deps]) => {
    deps.forEach((dep) => {
      builder.connectDep(parent, dep);
    });
  });

  return builder.build();
};
