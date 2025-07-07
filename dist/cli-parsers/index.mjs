import { DepGraphBuilder } from '@snyk/dep-graph';
import { getYarnLockfileType } from '../index.mjs';
import { LockfileType } from '../parsers/index.mjs';
import { extractNameAndIdentifier } from './cli-parser-utils.mjs';
import { parseYarnInfoOutput } from './yarn-info-parser.mjs';
import { parseYarnListOutput } from './yarn-list-parser.mjs';
export const buildDepGraphFromCliOutput = (rawCliOutput, lockfileContent, manifestFileContent) => {
    const manifestDependencies = JSON.parse(manifestFileContent).dependencies || {};
    const lockfileType = getYarnLockfileType(lockfileContent);
    const { name: rootName, version: rootVersion } = JSON.parse(manifestFileContent);
    const pkgManagerVersion = lockfileType === LockfileType.yarn ? '1' : '2';
    // Build depMap object from the cli output
    const formattedCliOutput = pkgManagerVersion === '1'
        ? parseYarnListOutput(rawCliOutput, manifestDependencies)
        : parseYarnInfoOutput(rawCliOutput);
    const rootPkgInfo = rootName
        ? Object.assign({ name: rootName }, (rootVersion && { version: rootVersion })) : undefined;
    const pkgManager = {
        name: 'yarn',
        version: pkgManagerVersion,
    };
    const builder = new DepGraphBuilder(pkgManager, rootPkgInfo);
    const { topLevelDeps, dependencies: depMap } = formattedCliOutput;
    // Add all nodes
    [...depMap.keys()].forEach((name) => {
        const { name: pkgName, identifier: pkgVersion } = extractNameAndIdentifier(name);
        builder.addPkgNode({ name: pkgName, version: pkgVersion.split(':').pop() }, name);
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
//# sourceMappingURL=index.js.map