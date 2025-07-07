import { InvalidUserInputError } from '../errors/index.mjs';
import { OutOfSyncError } from '../errors/index.mjs';
import { LockfileType } from '../parsers/index.mjs';
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
    const devDeps = getGraphDependencies(pkgJson.devDependencies || {}, true);
    const optionalDeps = options.includeOptionalDeps
        ? getGraphDependencies(pkgJson.optionalDependencies || {}, false)
        : {};
    const peerDeps = options.includePeerDeps
        ? getGraphDependencies(pkgJson.peerDependencies || {}, false)
        : {};
    const deps = Object.assign(Object.assign(Object.assign({}, prodDeps), optionalDeps), peerDeps);
    if (options.includeDevDeps) {
        // Ensure dev dependency 'isDev' flags are correctly set.
        // Dev dependencies are applied last to override shared keys with regular dependencies.
        return Object.assign(Object.assign({}, deps), devDeps);
    }
    // For includeDevDeps option set to false, simulate pnpm install --prod
    // by excluding all devDependencies,
    // ignoring potential duplicates in other dependency lists.
    // https://pnpm.io/cli/install#--prod--p
    return Object.keys(deps)
        .filter((packageName) => !devDeps.hasOwnProperty(packageName))
        .reduce((result, packageName) => {
        result[packageName] = deps[packageName];
        return result;
    }, {});
};
/**
 * Converts dependencies parsed from the a lock file to a dependencies object required by the graph.
 * For example, { 'mime-db': '~1.12.0' } will be converted to { 'mime-db': { version: '~1.12.0', isDev: true/false } }.
 */
export const getGraphDependencies = (dependencies, isDev) => {
    return Object.entries(dependencies).reduce((pnpmDeps, [name, semver]) => {
        pnpmDeps[name] = { version: semver, isDev: isDev };
        return pnpmDeps;
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