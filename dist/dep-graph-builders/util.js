import { InvalidUserInputError } from '../errors/index.js';
import { OutOfSyncError } from '../errors/index.js';
import { LockfileType } from '../parsers/index.js';
export const addPkgNodeToGraph = (depGraphBuilder, node, options) => {
    return depGraphBuilder.addPkgNode({ name: node.name, version: node.version }, node.id, {
        labels: Object.assign(Object.assign(Object.assign(Object.assign({ scope: node.isDev ? 'dev' : 'prod' }, (options.isCyclic && { pruned: 'cyclic' })), (options.isWorkspacePkg && { pruned: 'true' })), (node.missingLockFileEntry && { missingLockFileEntry: 'true' })), { resolved: node.resolved, integrity: node.integrity }),
    });
};
/**
 * Get top level dependencies from the given package json object which is parsed from a package.json file.
 * This includes both prod dependencies and dev dependencies supposing includeDevDeps is supported.
 */
export const getTopLevelDeps = (pkgJson, options) => {
    const prodDeps = getGraphDependencies(pkgJson.dependencies || {}, false);
    const devDeps = options.includeDevDeps
        ? getGraphDependencies(pkgJson.devDependencies || {}, true)
        : {};
    const optionalDeps = options.includeOptionalDeps
        ? getGraphDependencies(pkgJson.optionalDependencies || {}, false)
        : {};
    const peerDeps = options.includePeerDeps
        ? getGraphDependencies(pkgJson.peerDependencies || {}, false)
        : {};
    return Object.assign(Object.assign(Object.assign(Object.assign({}, prodDeps), devDeps), optionalDeps), peerDeps);
};
/**
 * Converts dependencies parsed from the a lock file to a dependencies object required by the graph.
 * For example, { 'mime-db': '~1.12.0' } will be converted to { 'mime-db': { version: '~1.12.0', isDev: true/false } }.
 */
export const getGraphDependencies = (dependencies, isDev) => {
    return Object.entries(dependencies).reduce((acc, [name, semver]) => {
        acc[name] = { version: semver, isDev: isDev };
        return acc;
    }, {});
};
export function parsePkgJson(pkgJsonContent) {
    try {
        const parsedPkgJson = JSON.parse(pkgJsonContent);
        if (!parsedPkgJson.name) {
            parsedPkgJson.name = 'package.json';
        }
        return parsedPkgJson;
    }
    catch (e) {
        throw new InvalidUserInputError('package.json parsing failed with error ' + e.message);
    }
}
export const getChildNode = (name, depInfo, pkgs, strictOutOfSync, includeOptionalDeps) => {
    const childNodeKey = `${name}@${depInfo.version}`;
    let childNode;
    if (!pkgs[childNodeKey]) {
        if (strictOutOfSync && !/^file:/.test(depInfo.version)) {
            throw new OutOfSyncError(childNodeKey, LockfileType.yarn);
        }
        else {
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
    }
    else {
        const depData = pkgs[childNodeKey];
        const dependencies = getGraphDependencies(depData.dependencies || {}, depInfo.isDev);
        const optionalDependencies = includeOptionalDeps
            ? getGraphDependencies(depData.optionalDependencies || {}, depInfo.isDev)
            : {};
        childNode = {
            id: `${name}@${depData.version}`,
            name: name,
            version: depData.version,
            resolved: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
            integrity: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/util.ts',
            dependencies: Object.assign(Object.assign({}, dependencies), optionalDependencies),
            isDev: depInfo.isDev,
        };
    }
    return childNode;
};
//# sourceMappingURL=util.js.map