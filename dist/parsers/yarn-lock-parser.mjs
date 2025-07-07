import * as yarnLockfileParser from '@yarnpkg/lockfile';
import { LockfileType, Scope, } from './index.mjs';
import { InvalidUserInputError } from '../errors/index.mjs';
import { LockParserBase } from './lock-parser-base.mjs';
import { config } from '../config.mjs';
export class YarnLockParser extends LockParserBase {
    constructor() {
        super(LockfileType.yarn, config.YARN_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const yarnLock = yarnLockfileParser.parse(lockFileContents);
            yarnLock.dependencies = yarnLock.object;
            yarnLock.type = this.type;
            return yarnLock;
        }
        catch (e) {
            throw new InvalidUserInputError(`yarn.lock parsing failed with an error: ${e.message}`);
        }
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        const depTree = await super.getDependencyTree(manifestFile, lockfile, includeDev, strictOutOfSync);
        const meta = { lockfileVersion: 1, packageManager: 'yarn' };
        const depTreeWithMeta = Object.assign(Object.assign({}, depTree), { meta: Object.assign(Object.assign({}, depTree.meta), meta) });
        return depTreeWithMeta;
    }
    getDepMap(lockfile) {
        const yarnLockfile = lockfile;
        const depMap = {};
        for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
            const subDependencies = Object.entries(Object.assign(Object.assign({}, (dep.dependencies || {})), (dep.optionalDependencies || {})));
            depMap[depName] = Object.assign(Object.assign({ labels: {
                    scope: Scope.prod,
                }, name: getName(depName), requires: subDependencies.map(([key, ver]) => `${key}@${ver}`), version: dep.version }, (dep.resolved && { resolved: dep.resolved })), (dep.integrity && { integrity: dep.integrity }));
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
//# sourceMappingURL=yarn-lock-parser.js.map