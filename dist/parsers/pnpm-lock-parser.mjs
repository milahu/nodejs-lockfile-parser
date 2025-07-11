"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageLockParser = void 0;
const index_1 = require("./index.mjs");
const errors_1 = require("../errors/index.mjs");
const lock_parser_base_1 = require("./lock-parser-base.mjs");
const config_1 = require("../config.mjs");
class PackageLockParser extends lock_parser_base_1.LockParserBase {
    constructor() {
        super(index_1.LockfileType.npm, config_1.config.NPM_TREE_SIZE_LIMIT);
    }
    parseLockFile(lockFileContents) {
        try {
            const packageLock = JSON.parse(lockFileContents);
            packageLock.type =
                packageLock.lockfileVersion === 1
                    ? index_1.LockfileType.npm
                    : index_1.LockfileType.npm7;
            this.type = packageLock.type;
            return packageLock;
        }
        catch (e) {
            throw new errors_1.InvalidUserInputError('package-lock.json parsing failed with ' + `error ${e.message}`);
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
                        scope: dep.dev ? index_1.Scope.dev : index_1.Scope.prod,
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
exports.PackageLockParser = PackageLockParser;
//# sourceMappingURL=pnpm-lock-parser.js.map