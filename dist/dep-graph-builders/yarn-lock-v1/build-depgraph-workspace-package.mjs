import { DepGraphBuilder } from '@snyk/dep-graph';
import { addPkgNodeToGraph, getTopLevelDeps } from '../util.mjs';
import { getChildNodeYarnLockV1Workspace } from './util.mjs';
import { eventLoopSpinner } from 'event-loop-spinner';
export const buildDepGraphYarnLockV1Workspace = async (extractedYarnLockV1Pkgs, pkgJson, workspacePkgNameToVersion, options) => {
    const { includeDevDeps, strictOutOfSync, includeOptionalDeps } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'yarn' }, { name: pkgJson.name, version: pkgJson.version });
    const visitedMap = new Set();
    const topLevelDeps = getTopLevelDeps(pkgJson, { includeDevDeps });
    const rootNode = {
        id: 'root-node',
        name: pkgJson.name,
        version: pkgJson.version,
        resolved: '',
        integrity: '',
        dependencies: topLevelDeps,
        isDev: false,
    };
    await dfsVisit(depGraphBuilder, rootNode, visitedMap, extractedYarnLockV1Pkgs, workspacePkgNameToVersion, strictOutOfSync, includeOptionalDeps);
    return depGraphBuilder.build();
};
/**
 * Use DFS to add all nodes and edges to the depGraphBuilder and prune cyclic nodes.
 * The colorMap keep track of the state of node during traversal.
 *  - If a node doesn't exist in the map, it means it hasn't been visited.
 *  - If a node is GRAY, it means it has already been discovered but its subtree hasn't been fully traversed.
 *  - If a node is BLACK, it means its subtree has already been fully traversed.
 *  - When first exploring an edge, if it points to a GRAY node, a cycle is found and the GRAY node is pruned.
 *     - A pruned node has id `${originalId}|1`
 * When coming across another workspace package as child node, simply add the node and edge to the graph and mark it as BLACK.
 */
const dfsVisit = async (depGraphBuilder, node, visitedMap, extractedYarnLockV1Pkgs, workspacePkgNameToVersion, strictOutOfSync, includeOptionalDeps) => {
    visitedMap.add(node.id);
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const isWorkspacePkg = !!workspacePkgNameToVersion[name];
        const childNode = getChildNodeYarnLockV1Workspace(name, depInfo, workspacePkgNameToVersion, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps);
        if (!visitedMap.has(childNode.id)) {
            addPkgNodeToGraph(depGraphBuilder, childNode, {
                isCyclic: false,
                isWorkspacePkg,
            });
            if (!isWorkspacePkg) {
                await dfsVisit(depGraphBuilder, childNode, visitedMap, extractedYarnLockV1Pkgs, workspacePkgNameToVersion, strictOutOfSync, includeOptionalDeps);
            }
        }
        depGraphBuilder.connectDep(node.id, childNode.id);
    }
};
//# sourceMappingURL=build-depgraph-workspace-package.js.map