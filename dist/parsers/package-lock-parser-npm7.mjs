import { LockfileType, Scope, } from './index.mjs';
import { InvalidUserInputError } from '../errors/index.mjs';
import { LockParserBase } from './lock-parser-base.mjs';
import { config } from '../config.mjs';
export class PackageLockParser extends LockParserBase {
    constructor() {
        super(LockfileType.npm, config.NPM_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const packageLock = JSON.parse(lockFileContents);
            packageLock.type =
                packageLock.lockfileVersion === 1
                    ? LockfileType.npm
                    : LockfileType.npm7;
            this.type = packageLock.type;
            return packageLock;
        }
        catch (e) {
            throw new InvalidUserInputError('package-lock.json parsing failed with ' +
                `error ${e.message}`);
        }
    }
    async getDependencyTree(manifestFile, lockfile, includeDev = false, strictOutOfSync = true) {
        const dependencyTree = await super.getDependencyTree(manifestFile, lockfile, includeDev, strictOutOfSync);
        const meta = {
            lockfileVersion: lockfile.lockfileVersion,
            packageManager: 'npm',
        };
        const depTreeWithMeta = Object.assign(Object.assign({}, dependencyTree), { meta: Object.assign(Object.assign({}, dependencyTree.meta), meta) });
        return depTreeWithMeta;
    }
    getDepMap(lockfile) {
        const packageLock = lockfile;
        const depMap = {};
        const flattenLockfileRec = (lockfileDeps, path) => {
            for (const [depName, dep] of Object.entries(lockfileDeps)) {
                const depNode = {
                    labels: {
                        scope: dep.dev ? Scope.dev : Scope.prod,
                    },
                    name: depName,
                    requires: [],
                    version: dep.version,
                };
                if (dep.requires) {
                    depNode.requires = Object.keys(dep.requires);
                }
                const depPath = [...path, depName];
                const depKey = depPath.join(this.pathDelimiter);
                depMap[depKey] = depNode;
                if (dep.dependencies) {
                    flattenLockfileRec(dep.dependencies, depPath);
                }
            }
        };
        flattenLockfileRec(packageLock.dependencies || {}, []);
        return depMap;
    }
    getDepTreeKey(dep) {
        return dep.name;
    }
}
//# sourceMappingURL=package-lock-parser-npm7.js.map