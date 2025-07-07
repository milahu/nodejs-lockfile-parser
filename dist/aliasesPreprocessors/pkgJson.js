import { parsePkgJson } from '../dep-graph-builders/util.js';
export const rewriteAliasesPkgJson = (packageJsonContent) => {
    const pkgJsonPreprocessed = parsePkgJson(packageJsonContent);
    pkgJsonPreprocessed.dependencies = rewriteAliases(pkgJsonPreprocessed.dependencies);
    pkgJsonPreprocessed.devDependencies = rewriteAliases(pkgJsonPreprocessed.devDependencies);
    pkgJsonPreprocessed.optionalDependencies = rewriteAliases(pkgJsonPreprocessed.optionalDependencies);
    pkgJsonPreprocessed.peerDependencies = rewriteAliases(pkgJsonPreprocessed.peerDependencies);
    return JSON.stringify(pkgJsonPreprocessed);
};
export const rewriteAliases = (dependencies) => {
    if (!dependencies) {
        return undefined;
    }
    const newDependencies = {};
    for (const key in dependencies) {
        const value = dependencies[key];
        if (value.startsWith('npm:')) {
            newDependencies[value.substring(4, value.lastIndexOf('@'))] =
                value.substring(value.lastIndexOf('@') + 1, value.length);
        }
        else {
            newDependencies[key] = value;
        }
    }
    return newDependencies;
};
//# sourceMappingURL=pkgJson.js.map