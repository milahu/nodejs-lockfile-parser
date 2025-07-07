import { DepGraphBuilder } from '@snyk/dep-graph';
import { getChildNode, getTopLevelDeps } from '../util.mjs';
import { eventLoopSpinner } from 'event-loop-spinner';
export const buildDepGraphYarnLockV1Simple = async (extractedYarnLockV1Pkgs, pkgJson, options) => {
    const { includeDevDeps, includeOptionalDeps, includePeerDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'yarn' }, { name: pkgJson.name, version: pkgJson.version });
    const topLevelDeps = getTopLevelDeps(pkgJson, {
        includeDevDeps,
        includePeerDeps,
        includeOptionalDeps,
    });
    const rootNode = {
        id: 'root-node',
        name: pkgJson.name,
        version: pkgJson.version,
        resolved: '',
        integrity: '',
        dependencies: topLevelDeps,
        isDev: false,
    };
    await dfsVisit(depGraphBuilder, rootNode, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps, pruneWithinTopLevelDeps);
    return depGraphBuilder.build();
};
/**
 * Use DFS to add all nodes and edges to the depGraphBuilder and prune cyclic nodes.
 * The visitedMap keep track of which nodes have already been discovered during traversal.
 *  - If a node doesn't exist in the map, it means it hasn't been visited.
 *  - If a node is already visited, simply connect the new node with this node.
 */
const dfsVisit = async (depGraphBuilder, node, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps, pruneWithinTopLevel, visited) => {
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const localVisited = visited || new Set();
        const childNode = getChildNode(name, depInfo, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps);
        if (localVisited.has(childNode.id)) {
            if (pruneWithinTopLevel) {
                const prunedId = `${childNode.id}:pruned`;
                depGraphBuilder.addPkgNode({ name: childNode.name, version: childNode.version }, prunedId, {
                    labels: Object.assign({ scope: node.isDev ? 'dev' : 'prod', pruned: 'true' }, (node.missingLockFileEntry && {
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
            labels: Object.assign({ scope: node.isDev ? 'dev' : 'prod' }, (node.missingLockFileEntry && {
                missingLockFileEntry: 'true',
            })),
        });
        depGraphBuilder.connectDep(node.id, childNode.id);
        localVisited.add(childNode.id);
        await dfsVisit(depGraphBuilder, childNode, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps, pruneWithinTopLevel, localVisited);
    }
};
//# sourceMappingURL=build-depgraph-simple.js.map