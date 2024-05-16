import { DepGraphBuilder } from '@snyk/dep-graph';
import { getTopLevelDeps } from '../util.js';
import { getPnpmChildNode } from './utils.js';
import { eventLoopSpinner } from 'event-loop-spinner';
export const buildDepGraphPnpm = async (lockFileParser, pkgJson, options, workspaceArgs) => {
    var _a;
    const { strictOutOfSync, includeOptionalDeps, includeDevDeps, pruneWithinTopLevelDeps, } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'pnpm' }, { name: pkgJson.name, version: pkgJson.version });
    lockFileParser.extractedPackages = lockFileParser.extractPackages();
    const extractedPnpmPkgs = lockFileParser.extractedPackages;
    const topLevelDeps = getTopLevelDeps(pkgJson, options);
    const extractedTopLevelDeps = lockFileParser.extractTopLevelDependencies(options) || {};
    for (const name of Object.keys(topLevelDeps)) {
        topLevelDeps[name].version = extractedTopLevelDeps[name].version;
    }
    const rootNode = {
        id: 'root-node',
        name: pkgJson.name,
        version: pkgJson.version,
        dependencies: topLevelDeps,
        isDev: false,
    };
    await dfsVisit(depGraphBuilder, rootNode, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, 
    // we have rootWorkspaceOverrides if this is workspace pkg with overrides
    // at root - therefore it should take precedent
    // TODO: inspect if this is needed at all, seems like pnpm resolves everything in lockfile
    (workspaceArgs === null || workspaceArgs === void 0 ? void 0 : workspaceArgs.rootOverrides) || ((_a = pkgJson.pnpm) === null || _a === void 0 ? void 0 : _a.overrides) || {}, pruneWithinTopLevelDeps, lockFileParser);
    return depGraphBuilder.build();
};
/**
 * Use DFS to add all nodes and edges to the depGraphBuilder and prune cyclic nodes.
 * The visitedMap keep track of which nodes have already been discovered during traversal.
 *  - If a node doesn't exist in the map, it means it hasn't been visited.
 *  - If a node is already visited, simply connect the new node with this node.
 */
const dfsVisit = async (depGraphBuilder, node, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, overrides, pruneWithinTopLevel, lockFileParser, visited) => {
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const localVisited = visited || new Set();
        const childNode = getPnpmChildNode(name, depInfo, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, lockFileParser);
        if (localVisited.has(childNode.id)) {
            if (pruneWithinTopLevel) {
                const prunedId = `${childNode.id}:pruned`;
                depGraphBuilder.addPkgNode({ name: childNode.name, version: childNode.version }, prunedId, {
                    labels: Object.assign({ scope: childNode.isDev ? 'dev' : 'prod', pruned: 'true' }, (node.missingLockFileEntry && {
                        missingLockFileEntry: 'true',
                    })),
                });
                depGraphBuilder.connectDep(node.id, prunedId);
            }
            else {
                depGraphBuilder.connectDep(node.id, childNode.id);
            }
            continue;
        }
        depGraphBuilder.addPkgNode({ name: childNode.name, version: childNode.version }, childNode.id, {
            labels: Object.assign({ scope: childNode.isDev ? 'dev' : 'prod' }, (node.missingLockFileEntry && {
                missingLockFileEntry: 'true',
            })),
        });
        depGraphBuilder.connectDep(node.id, childNode.id);
        localVisited.add(childNode.id);
        await dfsVisit(depGraphBuilder, childNode, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, overrides, pruneWithinTopLevel, lockFileParser, localVisited);
    }
};
//# sourceMappingURL=build-dep-graph-pnpm.js.map