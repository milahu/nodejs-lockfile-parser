import _cloneDeep from 'lodash.clonedeep';
import _isEmpty from 'lodash.isempty';
import _toPairs from 'lodash.topairs';
import graphlib from '@snyk/graphlib';
import { v4 as uuid } from 'uuid';
import { eventLoopSpinner } from 'event-loop-spinner';
import baseDebug from 'debug';
import { extractNameAndIdentifier } from '../cli-parsers/cli-parser-utils.mjs';
import { createDepTreeDepFromDep, getTopLevelDeps, LockfileType, Scope, } from './index.mjs';
import { InvalidUserInputError, OutOfSyncError, TreeSizeLimitError, } from '../errors/index.mjs';
const debug = baseDebug('snyk-nodejs-parser');
export class LockParserBase {
    constructor(type, treeSizeLimit) {
        this.type = type;
        this.treeSizeLimit = treeSizeLimit;
        this.pathDelimiter = '|';
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        var _a;
        if (lockfile.type !== this.type) {
            throw new InvalidUserInputError('Unsupported lockfile provided. Please ' +
                'provide `package-lock.json`.');
        }
        const yarnLock = lockfile;
        const depTree = {
            dependencies: {},
            hasDevDependencies: !_isEmpty(manifestFile.devDependencies),
            name: manifestFile.name,
            size: 1,
            version: manifestFile.version || '',
        };
        const nodeVersion = (_a = manifestFile === null || manifestFile === void 0 ? void 0 : manifestFile.engines) === null || _a === void 0 ? void 0 : _a.node;
        if (nodeVersion) {
            if (!depTree.meta) {
                depTree.meta = {};
            }
            depTree.meta.nodeVersion = nodeVersion;
        }
        // asked to process empty deps
        if (_isEmpty(manifestFile.dependencies) && !includeDev) {
            return depTree;
        }
        // prepare a flat map, where dependency path is a key to dependency object
        // path is an unique identifier for each dependency and corresponds to the
        // relative path on disc
        const depMap = this.getDepMap(yarnLock, manifestFile.resolutions);
        // all paths are identified, we can create a graph representing what depends on what
        const depGraph = this.createGraphOfDependencies(depMap, strictOutOfSync);
        // topological sort will be applied and it requires acyclic graphs
        let cycleStarts = {};
        if (!graphlib.alg.isAcyclic(depGraph)) {
            const cycles = graphlib.alg.findCycles(depGraph);
            for (const cycle of cycles) {
                // Since one of top level dependencies can be a start of cycle and that node
                // will be duplicated, we need to store a link between original node
                // and the new one in order to identify those duplicated top level dependencies
                cycleStarts = Object.assign(Object.assign({}, cycleStarts), this.removeCycle(cycle, depMap, depGraph));
            }
        }
        // transform depMap to a map of PkgTrees
        const { depTrees, depTreesSizes } = await this.createDepTrees(depMap, depGraph);
        // Only include peerDependencies if using npm and npm is at least
        // version 7 as npm v7 automatically installs peerDependencies
        // get trees for dependencies from manifest file
        const topLevelDeps = getTopLevelDeps({
            targetFile: manifestFile,
            includeDev,
            includePeerDeps: lockfile.type === LockfileType.npm7,
            applyYarn2Resolutions: lockfile.type === LockfileType.yarn2,
        });
        // number of dependencies including root one
        let treeSize = 1;
        for (const dep of topLevelDeps) {
            if (treeSize > this.treeSizeLimit) {
                throw new TreeSizeLimitError();
            }
            // if any of top level dependencies is a part of cycle
            // it now has a different item in the map
            const key = this.getDepTreeKey(dep);
            const depName = cycleStarts[key] || key;
            if (depTrees[depName]) {
                // if the top level dependency is dev, all children are dev
                depTree.dependencies[dep.name] = dep.dev
                    ? this.setDevDepRec(_cloneDeep(depTrees[depName]))
                    : depTrees[depName];
                treeSize += depTreesSizes[depName];
                if (eventLoopSpinner.isStarving()) {
                    await eventLoopSpinner.spin();
                }
            }
            else if (/^file:/.test(dep.version)) {
                depTree.dependencies[dep.name] = createDepTreeDepFromDep(dep);
                treeSize++;
            }
            else {
                // TODO: also check the package version
                // for a stricter check
                if (strictOutOfSync) {
                    throw new OutOfSyncError(dep.name, this.type);
                }
                depTree.dependencies[dep.name] = createDepTreeDepFromDep(dep);
                if (!depTree.dependencies[dep.name].labels) {
                    depTree.dependencies[dep.name].labels = {};
                }
                depTree.dependencies[dep.name].labels.missingLockFileEntry = 'true';
                treeSize++;
            }
        }
        depTree.size = treeSize;
        return depTree;
    }
    setDevDepRec(pkgTree) {
        for (const [name, subTree] of _toPairs(pkgTree.dependencies)) {
            pkgTree.dependencies[name] = this.setDevDepRec(subTree);
        }
        pkgTree.labels = Object.assign(Object.assign({}, pkgTree.labels), { scope: Scope.dev });
        return pkgTree;
    }
    /* Algorithm for cycle removal:
      For every node in a cycle:
        1. Create a duplicate of entry node (without edges)
        2. For every cyclic dependency of entry node, create a duplicate of
            the dependency and connect it with the duplicated entry node
        3.a If edge goes to already-visited dependency, end of cycle is found;
            update metadata and do not continue traversing
        3.b Follow the edge and repeat the process, storing visited dependency-paths.
            All non-cyclic dependencies of duplicated node need to be updated.
        4. All non-cyclic dependencies or dependants of original node need to be
          updated to be connected with the duplicated one
  
      Once completed for all nodes in a cycle, original cyclic nodes can
      be removed.
    */
    removeCycle(cycle, depMap, depGraph) {
        /* FUNCTION DEFINITION
        To keep an order of algorithm steps readable, function is defined on-the-fly
        Arrow function is used for calling `this` without .bind(this) in the end
        */
        const acyclicDuplicationRec = (node, traversed, currentCycle, nodeCopy) => {
            // 2. For every cyclic dependency of entry node...
            const edgesToProcess = depGraph.inEdges(node).filter((e) => currentCycle.includes(e.v));
            for (const edge of edgesToProcess) {
                // ... create a duplicate of the dependency...
                const child = edge.v;
                const dependencyCopy = this.cloneNodeWithoutEdges(child, depMap, depGraph);
                // ...and connect it with the duplicated entry node
                depGraph.setEdge(dependencyCopy, nodeCopy);
                // 3.a If edge goes to already-visited dependency, end of cycle is found;
                if (traversed.includes(child)) {
                    // update metadata and labels and do not continue traversing
                    if (!depMap[dependencyCopy].labels) {
                        depMap[dependencyCopy].labels = {};
                    }
                    depMap[dependencyCopy].labels.pruned = 'cyclic';
                }
                else {
                    // 3.b Follow the edge and repeat the process, storing visited dependency-paths
                    acyclicDuplicationRec(child, [...traversed, node], currentCycle, dependencyCopy);
                    // All non-cyclic dependencies of duplicated node need to be updated.
                    this.cloneAcyclicNodeEdges(child, dependencyCopy, cycle, depGraph, {
                        inEdges: true,
                        outEdges: false,
                    });
                }
            }
        };
        const cycleStarts = {};
        // For every node in a cycle:
        for (const start of cycle) {
            // 1. Create a uniqe duplicate of entry node (without edges)
            const clonedNode = this.cloneNodeWithoutEdges(start, depMap, depGraph);
            cycleStarts[start] = clonedNode;
            // CALL of previously defined function
            acyclicDuplicationRec(start, [], cycle, clonedNode);
            // 4. All non-cyclic dependencies or dependants of original node need to be
            //   updated to be connected with the duplicated one
            this.cloneAcyclicNodeEdges(start, clonedNode, cycle, depGraph, {
                inEdges: true,
                outEdges: true,
            });
        }
        // Once completed for all nodes in a cycle, original cyclic nodes can
        // be removed.
        for (const start of cycle) {
            depGraph.removeNode(start);
        }
        return cycleStarts;
    }
    cloneAcyclicNodeEdges(nodeFrom, nodeTo, cycle, depGraph, { inEdges, outEdges }) {
        // node has to have edges
        const edges = depGraph.nodeEdges(nodeFrom);
        if (outEdges) {
            const parentEdges = edges.filter((e) => !cycle.includes(e.w));
            for (const edge of parentEdges) {
                const parent = edge.w;
                depGraph.setEdge(nodeTo, parent);
            }
        }
        if (inEdges) {
            const childEdges = edges.filter((e) => !cycle.includes(e.v));
            for (const edge of childEdges) {
                const child = edge.v;
                depGraph.setEdge(child, nodeTo);
            }
        }
    }
    cloneNodeWithoutEdges(node, depMap, depGraph) {
        const newNode = node + uuid();
        // update depMap with new node
        depMap[newNode] = _cloneDeep(depMap[node]);
        // add new node to the graph
        depGraph.setNode(newNode);
        return newNode;
    }
    createGraphOfDependencies(depMap, strictOutOfSync = true) {
        const depGraph = new graphlib.Graph();
        for (const depKey of Object.keys(depMap)) {
            depGraph.setNode(depKey);
        }
        for (const [depPath, dep] of Object.entries(depMap)) {
            for (const depName of dep.requires) {
                const subDepPath = this.findDepsPath(depPath, depName, depMap, strictOutOfSync);
                // direction is from the dependency to the package requiring it
                depGraph.setEdge(subDepPath, depPath);
            }
        }
        return depGraph;
    }
    // dependency in package-lock.json v1 can be defined either inside `dependencies`
    // of other dependency or anywhere upward towards root
    findDepsPath(startPath, depName, depMap, strictOutOfSync = true) {
        const depPath = startPath.split(this.pathDelimiter);
        while (depPath.length) {
            const currentPath = depPath.concat(depName).join(this.pathDelimiter);
            if (depMap[currentPath]) {
                return currentPath;
            }
            depPath.pop();
        }
        if (!depMap[depName]) {
            debug(`Dependency ${depName} not found`);
            if (strictOutOfSync) {
                throw new OutOfSyncError(depName, this.type);
            }
        }
        return depName;
    }
    // Algorithm is based on dynamic programming technique and tries to build
    // "more simple" trees and compose them into bigger ones.
    async createDepTrees(depMap, depGraph) {
        var _a;
        // Graph has to be acyclic
        if (!graphlib.alg.isAcyclic(depGraph)) {
            throw new Error('Cycles were not removed from graph.');
        }
        const depTrees = {};
        const depTreesSizes = {};
        // topological sort guarantees that when we create a pkg-tree for a dep,
        // all it's sub-trees were already created. This also implies that leaf
        // packages will be processed first as they have no sub-trees.
        const depOrder = graphlib.alg.topsort(depGraph);
        while (depOrder.length) {
            const depKey = depOrder.shift();
            const dep = depMap[depKey];
            let treeSize = 1;
            if (!dep) {
                debug(`Missing entry for ${depKey}`);
                continue;
            }
            // direction is from the dependency to the package requiring it, so we are
            // looking for predecessors
            for (const subDepPath of depGraph.predecessors(depKey)) {
                let subDep = depTrees[subDepPath];
                if (!dep.dependencies) {
                    dep.dependencies = {};
                }
                if (!subDep) {
                    debug(`Missing entry for ${subDepPath}`);
                    const { name, identifier } = extractNameAndIdentifier(subDepPath);
                    subDep = {
                        name: name,
                        version: identifier,
                        dependencies: {},
                        labels: Object.assign({ missingLockFileEntry: 'true' }, (((_a = dep.labels) === null || _a === void 0 ? void 0 : _a.scope) && { scope: dep.labels.scope })),
                    };
                    treeSize += 1;
                }
                else {
                    treeSize += depTreesSizes[subDepPath];
                }
                dep.dependencies[subDep.name] = subDep;
            }
            const depTreeDep = Object.assign(Object.assign(Object.assign(Object.assign({ labels: dep.labels, name: dep.name, version: dep.version }, (dep.resolved && { resolved: dep.resolved })), (dep.integrity && { integrity: dep.integrity })), (dep.checksum && { checksum: dep.checksum })), (dep.resolution && { resolution: dep.resolution }));
            if (dep.dependencies) {
                depTreeDep.dependencies = dep.dependencies;
            }
            depTrees[depKey] = depTreeDep;
            depTreesSizes[depKey] = treeSize;
            // Since this code doesn't handle any I/O or network, we need to force
            // event loop to tick while being used in server for request processing
            if (eventLoopSpinner.isStarving()) {
                await eventLoopSpinner.spin();
            }
        }
        return { depTrees, depTreesSizes };
    }
    getDepMap(lockfile, // eslint-disable-line @typescript-eslint/no-unused-vars
    resolutions) {
        throw new Error('Not implemented');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getDepTreeKey(dep) {
        throw new Error('Not implemented');
    }
}
//# sourceMappingURL=lock-parser-base.js.map