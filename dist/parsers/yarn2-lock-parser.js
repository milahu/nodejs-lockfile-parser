import { load, FAILSAFE_SCHEMA } from 'js-yaml';
import yarnCore from '@yarnpkg/core';
import { LockParserBase } from './lock-parser-base.js';
import { LockfileType, Scope, } from './index.js';
import { config } from '../config.js';
import { InvalidUserInputError } from '../errors/index.js';
import { yarnLockFileKeyNormalizer } from './yarn-utils.js';
export class Yarn2LockParser extends LockParserBase {
    constructor() {
        super(LockfileType.yarn2, config.YARN_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const rawYarnLock = load(lockFileContents, {
                json: true,
                schema: FAILSAFE_SCHEMA,
            });
            delete rawYarnLock.__metadata;
            const dependencies = {};
            const structUtils = yarnCore.structUtils;
            const parseDescriptor = structUtils.parseDescriptor;
            const parseRange = structUtils.parseRange;
            const keyNormalizer = yarnLockFileKeyNormalizer(parseDescriptor, parseRange);
            Object.entries(rawYarnLock).forEach(([fullDescriptor, versionData]) => {
                keyNormalizer(fullDescriptor).forEach((descriptor) => {
                    dependencies[descriptor] = versionData;
                });
            });
            return {
                dependencies,
                lockfileType: LockfileType.yarn2,
                object: dependencies,
                type: LockfileType.yarn2,
            };
        }
        catch (e) {
            throw new InvalidUserInputError(`yarn.lock parsing failed with an error: ${e.message}`);
        }
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        const depTree = await super.getDependencyTree(manifestFile, lockfile, includeDev, strictOutOfSync);
        const meta = { lockfileVersion: 2, packageManager: 'yarn' };
        const depTreeWithMeta = Object.assign(Object.assign({}, depTree), { meta: Object.assign(Object.assign({}, depTree.meta), meta) });
        return depTreeWithMeta;
    }
    getDepMap(lockfile, resolutions) {
        const yarnLockfile = lockfile;
        const depMap = {};
        const dependencies = lockfile.dependencies || {};
        for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
            const subDependencies = Object.entries(Object.assign(Object.assign({}, (dep.dependencies || {})), (dep.optionalDependencies || {}))).map(([key, ver]) => findResolutions(dependencies, depName, key, resolutions) ||
                `${key}@${ver}`);
            depMap[depName] = Object.assign(Object.assign({ labels: {
                    scope: Scope.prod,
                }, name: getName(depName), requires: subDependencies, version: dep.version }, (dep.resolution && { resolution: dep.resolution })), (dep.checksum && { checksum: dep.checksum }));
        }
        return depMap;
    }
    getDepTreeKey(dep) {
        return `${dep.name}@${dep.version}`;
    }
}
function getName(depName) {
    return depName.slice(0, depName.indexOf('@', 1));
}
function findResolutions(dependencies, depName, subDepKey, resolutions) {
    if (!resolutions)
        return;
    const resolutionKeys = Object.keys(resolutions);
    const index = depName.indexOf('@', 1);
    const name = depName.slice(0, index);
    const version = depName.slice(index + 1);
    const firstMatchingResolution = resolutionKeys.find((res) => {
        if (!res.endsWith(subDepKey)) {
            return false;
        }
        const leadingPkg = res.split(subDepKey)[0].slice(0, -1);
        const noSpecifiedParent = !leadingPkg;
        const specifiedParentMatchesCurrentDep = leadingPkg === name;
        const specifiedParentWithVersionMatches = leadingPkg.includes(name) &&
            leadingPkg.includes(dependencies[`${name}@${version}`].version);
        return (noSpecifiedParent ||
            specifiedParentMatchesCurrentDep ||
            specifiedParentWithVersionMatches);
    });
    if (resolutionKeys && firstMatchingResolution) {
        return `${subDepKey}@${resolutions[firstMatchingResolution]}`;
    }
}
//# sourceMappingURL=yarn2-lock-parser.js.map