export const rewriteAliasesInNpmLockV2 = (lockfilePackages) => {
    // 1. Rewrite top level "" packages in "".dependencies
    const rootPkg = lockfilePackages[''];
    const mutatedRootPkg = [];
    const lockFileToReturn = lockfilePackages;
    if (rootPkg && rootPkg.dependencies) {
        const dependencies = rootPkg.dependencies;
        for (const pkgName in rootPkg.dependencies) {
            if (rootPkg.dependencies[pkgName].startsWith('npm:')) {
                const aliasName = rootPkg.dependencies[pkgName].substring(4, rootPkg.dependencies[pkgName].lastIndexOf('@'));
                const aliasVersion = rootPkg.dependencies[pkgName].substring(rootPkg.dependencies[pkgName].lastIndexOf('@') + 1, rootPkg.dependencies[pkgName].length);
                dependencies[aliasName] = aliasVersion;
                mutatedRootPkg.push(pkgName);
            }
            else {
                dependencies[pkgName] = rootPkg.dependencies[pkgName];
            }
        }
        lockFileToReturn[''].dependencies = dependencies;
    }
    // 2. Rewrite alias packages
    for (const pkgName in lockfilePackages) {
        if (pkgName != '' &&
            lockfilePackages[pkgName].name &&
            mutatedRootPkg.includes(pkgName.replace('node_modules/', ''))) {
            lockFileToReturn[`node_modules/${lockfilePackages[pkgName].name}`] =
                lockfilePackages[pkgName];
            delete lockFileToReturn[pkgName];
        }
    }
    return lockFileToReturn;
};
//# sourceMappingURL=npm-lock-v2.js.map