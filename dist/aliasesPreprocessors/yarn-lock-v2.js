import * as cloneDeep from 'lodash.clonedeep';
export const rewriteAliasesInYarnLockV2 = (pkgJson, lockfileNormalisedPkgs) => {
    var _a;
    const lockfileNormalisedPkgsPreprocessed = cloneDeep(lockfileNormalisedPkgs);
    const topLevelPkgs = JSON.parse(pkgJson).dependencies;
    const topLevelAliasedPkgs = Object.entries(topLevelPkgs)
        .filter((entry) => {
        return entry[1].startsWith('npm:');
    })
        .map((entry) => {
        return `${entry[0]}@${entry[1]}`;
    });
    for (const pkg in lockfileNormalisedPkgsPreprocessed) {
        const pkgSplit = pkg.substring(0, pkg.lastIndexOf('@'));
        const resolutionSplit = (_a = lockfileNormalisedPkgsPreprocessed[pkg].resolution) === null || _a === void 0 ? void 0 : _a.split(/@npm[:%3A]/)[0];
        if (!pkg.startsWith('v2@workspace') &&
            resolutionSplit &&
            pkgSplit != resolutionSplit &&
            topLevelAliasedPkgs.includes(pkg)) {
            const newPkg = lockfileNormalisedPkgsPreprocessed[pkg];
            delete lockfileNormalisedPkgsPreprocessed[pkg];
            const newKey = pkg.replace(pkgSplit, resolutionSplit);
            lockfileNormalisedPkgsPreprocessed[newKey] = newPkg;
        }
        if (pkg.startsWith('v2@workspace')) {
            const newDependencies = {};
            for (const key in lockfileNormalisedPkgsPreprocessed[pkg].dependencies) {
                const value = lockfileNormalisedPkgsPreprocessed[pkg].dependencies[key];
                if (value.startsWith('npm:')) {
                    newDependencies[value.substring(4, value.lastIndexOf('@'))] =
                        value.substring(value.lastIndexOf('@') + 1, value.length);
                }
                else {
                    newDependencies[key] = value;
                }
            }
            lockfileNormalisedPkgsPreprocessed[pkg].dependencies = newDependencies;
        }
    }
    return lockfileNormalisedPkgsPreprocessed;
};
//# sourceMappingURL=yarn-lock-v2.js.map