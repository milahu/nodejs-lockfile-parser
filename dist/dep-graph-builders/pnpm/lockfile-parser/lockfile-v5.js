import { parse } from 'dependency-path';
import { PnpmLockfileParser } from './lockfile-parser.js';
export class LockfileV5Parser extends PnpmLockfileParser {
    constructor(rawPnpmLock, workspaceArgs) {
        super(rawPnpmLock, workspaceArgs);
        const depsRoot = this.getRoot(rawPnpmLock);
        this.specifiers = depsRoot.specifiers;
    }
    parseDepPath(depPath) {
        // The 'dependency-path' parsing package only works for lockfiles v5
        const { name, version } = parse(depPath);
        if (!version) {
            return { name };
        }
        return {
            name,
            version: this.excludeTransPeerDepsVersions(version),
        };
    }
    normalizeTopLevelDeps(dependencies, isDev) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, version]) => {
            version = this.normalizeVersion(name, version, isDev);
            pnpmDeps[name] = {
                name,
                version,
                isDev,
                specifier: this.specifiers[name],
            };
            return pnpmDeps;
        }, {});
    }
    normalizePackagesDeps(dependencies, isDev) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, version]) => {
            version = this.normalizeVersion(name, version, isDev);
            pnpmDeps[name] = version;
            return pnpmDeps;
        }, {});
    }
    // Dependency path and versions include transitive peer dependencies separated by '_'
    // e.g. in dependencies
    // dependencies:
    //    acorn-jsx: 5.3.2_acorn@7.4.1
    // OR in dependency path:
    // '/@babel/preset-typescript/7.12.13_@babel+core@7.12.13'
    // https://github.com/pnpm/spec/blob/master/dependency-path.md
    excludeTransPeerDepsVersions(fullVersionStr) {
        return fullVersionStr.split('_')[0];
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    normaliseImporters(rawPnpmLock) {
        if (!('importers' in rawPnpmLock)) {
            return {};
        }
        const rawImporters = rawPnpmLock.importers;
        return Object.entries(rawImporters).reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc, [key, val]) => {
            // No deps case
            if (!('dependencies' in val)) {
                return Object.assign(Object.assign({}, acc), { [key]: {} });
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const deps = val.dependencies;
            const depsNormalized = Object.fromEntries(Object.entries(deps).map(([depName, version]) => {
                return [depName, version];
            }));
            return Object.assign(Object.assign({}, acc), { [key]: depsNormalized });
        }, {});
    }
}
//# sourceMappingURL=lockfile-v5.js.map