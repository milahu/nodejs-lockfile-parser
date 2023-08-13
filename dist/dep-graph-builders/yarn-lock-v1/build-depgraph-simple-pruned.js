import { DepGraphBuilder } from '@snyk/dep-graph';
import { addPkgNodeToGraph, getChildNode, getTopLevelDeps, } from '../util.js';
import { eventLoopSpinner } from 'event-loop-spinner';
var Color;
(function (Color) {
    Color[Color["GRAY"] = 0] = "GRAY";
    Color[Color["BLACK"] = 1] = "BLACK";
})(Color || (Color = {}));
export const buildDepGraphYarnLockV1SimpleCyclesPruned = async (extractedYarnLockV1Pkgs, pkgJson, options) => {
    const { includeDevDeps, strictOutOfSync, includeOptionalDeps } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'yarn' }, { name: pkgJson.name, version: pkgJson.version });
    const colorMap = {};
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
    await dfsVisit(depGraphBuilder, rootNode, colorMap, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps);
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
 */
const dfsVisit = async (depGraphBuilder, node, colorMap, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps) => {
    colorMap[node.id] = Color.GRAY;
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const childNode = getChildNode(name, depInfo, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps);
        if (!colorMap.hasOwnProperty(childNode.id)) {
            addPkgNodeToGraph(depGraphBuilder, childNode, {});
            await dfsVisit(depGraphBuilder, childNode, colorMap, extractedYarnLockV1Pkgs, strictOutOfSync, includeOptionalDeps);
        }
        else if (colorMap[childNode.id] === Color.GRAY) {
            // cycle detected
            childNode.id = `${childNode.id}:pruned`;
            addPkgNodeToGraph(depGraphBuilder, childNode, { isCyclic: true });
        }
        depGraphBuilder.connectDep(node.id, childNode.id);
    }
    colorMap[node.id] = Color.BLACK;
};
//# sourceMappingURL=build-depgraph-simple-pruned.js.map