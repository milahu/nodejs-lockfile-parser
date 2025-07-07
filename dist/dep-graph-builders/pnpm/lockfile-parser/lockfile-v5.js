import { parse } from 'dependency-path';
import { PnpmLockfileParser } from './lockfile-parser.js';
export class LockfileV5Parser extends PnpmLockfileParser {
    constructor(rawPnpmLock, workspaceArgs) {
        // In case of no dependencies, pnpm@7 (lokfile version 5)
        // does not create a lockfile at `pnpm install`
        if (!rawPnpmLock) {
            rawPnpmLock = {
                lockfileVersion: '5',
            };
        }
        super(rawPnpmLock, workspaceArgs);
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
    normalizeTopLevelDeps(dependencies, isDev, importerName) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, version]) => {
            version = this.normalizeVersion(name, version, isDev, importerName);
            pnpmDeps[name] = {
                name,
                version,
                isDev,
            };
            return pnpmDeps;
        }, {});
    }
    normalizePackagesDeps(dependencies, isDev, importerName) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, version]) => {
            version = this.normalizeVersion(name, version, isDev, importerName);
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
        if (!fullVersionStr.includes('/')) {
            return fullVersionStr.split('_')[0];
        }
        // When dealing with dependency paths, the dependency name can include '_'
        // so we need to make sure the '_' we split by is after '/'
        const splitSlashes = fullVersionStr.split('/');
        const stringAfterLastSlash = splitSlashes[splitSlashes.length - 1];
        const stringBeforeLastSlash = fullVersionStr.split(stringAfterLastSlash)[0];
        const stringBetweenLastSlashAndUnderscore = stringAfterLastSlash.split('_')[0];
        return `${stringBeforeLastSlash}${stringBetweenLastSlashAndUnderscore}`;
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