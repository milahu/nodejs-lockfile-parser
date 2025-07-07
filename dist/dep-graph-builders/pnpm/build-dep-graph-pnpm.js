import { DepGraphBuilder } from '@snyk/dep-graph';
import { getTopLevelDeps } from '../util.js';
import { getPnpmChildNode } from './utils.js';
import { eventLoopSpinner } from 'event-loop-spinner';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';
import { INSTALL_COMMAND, LOCK_FILE_NAME, } from '../../errors/out-of-sync-error.js';
import { LockfileType } from '../../index.js';
import _debugModule from 'debug';
const debugModule = _debugModule.default || _debugModule;
import { UNDEFINED_VERSION } from './constants.js';
const debug = debugModule('snyk-pnpm-workspaces');
export const buildDepGraphPnpm = async (lockFileParser, pkgJson, options, importer) => {
    var _a;
    const { strictOutOfSync, includeOptionalDeps, includeDevDeps, pruneWithinTopLevelDeps, } = options;
    const depGraphBuilder = new DepGraphBuilder({ name: 'pnpm' }, { name: pkgJson.name, version: pkgJson.version || UNDEFINED_VERSION });
    lockFileParser.extractedPackages = lockFileParser.extractPackages();
    const extractedPnpmPkgs = lockFileParser.extractedPackages;
    const topLevelDeps = getTopLevelDeps(pkgJson, options);
    const extractedTopLevelDeps = lockFileParser.extractTopLevelDependencies(options, importer) || {};
    for (const name of Object.keys(topLevelDeps)) {
        if (!extractedTopLevelDeps[name]) {
            if (!strictOutOfSync) {
                continue;
            }
            const errMessage = `Dependency ${name} was not found in ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]}. Your package.json and ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]} are probably out of sync. Please run ` +
                `"${INSTALL_COMMAND[LockfileType.pnpm]}" and try again.`;
            debug(errMessage);
            throw new OpenSourceEcosystems.PnpmOutOfSyncError(errMessage);
        }
        topLevelDeps[name].version = extractedTopLevelDeps[name].version;
    }
    const rootNode = {
        id: 'root-node',
        name: pkgJson.name,
        version: pkgJson.version,
        dependencies: topLevelDeps,
        isDev: false,
    };
    const rootNodeId = `${pkgJson.name}@${pkgJson.version}`;
    await dfsVisit(depGraphBuilder, rootNodeId, rootNode, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, ((_a = pkgJson.pnpm) === null || _a === void 0 ? void 0 : _a.overrides) || {}, pruneWithinTopLevelDeps, lockFileParser);
    return depGraphBuilder.build();
};
/**
 * Use DFS to add all nodes and edges to the depGraphBuilder and prune cyclic nodes.
 * The visitedMap keep track of which nodes have already been discovered during traversal.
 *  - If a node doesn't exist in the map, it means it hasn't been visited.
 *  - If a node is already visited, simply connect the new node with this node.
 */
const dfsVisit = async (depGraphBuilder, rootNodeId, node, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, overrides, pruneWithinTopLevel, lockFileParser, visited) => {
    for (const [name, depInfo] of Object.entries(node.dependencies || {})) {
        if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
        }
        const localVisited = visited || new Set();
        const childNode = getPnpmChildNode(name, depInfo, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, lockFileParser);
        if (localVisited.has(childNode.id) || childNode.id == rootNodeId) {
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
        await dfsVisit(depGraphBuilder, rootNodeId, childNode, extractedPnpmPkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, overrides, pruneWithinTopLevel, lockFileParser, localVisited);
    }
};
//# sourceMappingURL=build-dep-graph-pnpm.js.map