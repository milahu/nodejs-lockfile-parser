import { DepGraphBuilder } from '@snyk/dep-graph';
import { getTopLevelDeps } from '../util.mjs';
import { getYarnLockV2ChildNode } from './utils.mjs';
import { eventLoopSpinner } from 'event-loop-spinner';
export const buildDepGraphYarnLockV2Simple = async (extractedYarnLockV2Pkgs, pkgJson, options, workspaceArgs) => {
    const { includeDevDeps, strictOutOfSync, includeOptionalDeps, pruneWithinTopLevelDeps, } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'yarn' }, { name: pkgJson.name, version: pkgJson.version });
    const topLevelDeps = getTopLevelDeps(pkgJson, {
        includeDevDeps,
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
    await dfsVisit(depGraphBuilder, rootNode, extractedYarnLockV2Pkgs, strictOutOfSync, includeOptionalDeps, 
    // we have rootWorkspaceResolutions if this is workspace pkg with resolutions
    // at root - therefore it should take precedent
    (workspaceArgs === null || workspaceArgs === void 0 ? void 0 : workspaceArgs.rootResolutions) || pkgJson.resolutions || {}, pruneWithinTopLevelDeps);
    return depGraphBuilder.build();
};
/**
 * Use DFS to add all nodes and edges to the depGraphBuilder and prune cyclic nodes.
 * The visitedMap keep track of which nodes have already been discovered during traversal.
 *  - If a node doesn't exist in the map, it means it hasn't been visited.
 *  - If a node is already visited, simply connect the new node with this node.
 */
const dfsVisit = async (depGraphBuilder, node, extractedYarnLockV2Pkgs, strictOutOfSync, includeOptionalDeps, resolutions, pruneWithinTopLevel, visited) => {
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const localVisited = visited || new Set();
        const childNode = getYarnLockV2ChildNode(name, depInfo, extractedYarnLockV2Pkgs, strictOutOfSync, includeOptionalDeps, resolutions, node);
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
        await dfsVisit(depGraphBuilder, childNode, extractedYarnLockV2Pkgs, strictOutOfSync, includeOptionalDeps, resolutions, pruneWithinTopLevel, localVisited);
    }
};
//# sourceMappingURL=build-depgraph-simple.js.map