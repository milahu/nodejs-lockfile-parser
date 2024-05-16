import { PnpmLockfileParser } from './lockfile-parser.js';
export class LockfileV6Parser extends PnpmLockfileParser {
    constructor(rawPnpmLock, workspaceArgs) {
        super(rawPnpmLock, workspaceArgs);
        this.settings = rawPnpmLock.settings;
    }
    parseDepPath(depPath) {
        // Exclude transitive peer deps from depPath
        // e.g. '/cdktf-cli@0.20.3(ink@3.2.0)(react@17.0.2)' -> cdktf-cli@0.20.3
        depPath = this.excludeTransPeerDepsVersions(depPath);
        // Check if path is absolute (doesn't start with '/')
        // If it's not absolute, omit first '/'
        depPath = LockfileV6Parser.isAbsoluteDepenencyPath(depPath)
            ? depPath
            : depPath.substring(1);
        // Next, get version based on the last occurence of '@' separator
        // e.g. @babel/code-frame@7.24.2 -> name: @babel/code-frame and version: 7.24.2
        const sepIndex = depPath.lastIndexOf('@');
        if (sepIndex === -1) {
            return {};
        }
        const name = depPath.substring(0, sepIndex);
        const version = depPath.substring(sepIndex + 1);
        return {
            name,
            version,
        };
    }
    normalizeTopLevelDeps(dependencies, isDev) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, depInfo]) => {
            const version = this.normalizeVersion(name, depInfo.version, isDev);
            pnpmDeps[name] = {
                name,
                version,
                specifier: depInfo.specifier,
                isDev,
            };
            return pnpmDeps;
        }, {});
    }
    normalizePackagesDeps(dependencies, isDev) {
        return Object.entries(dependencies).reduce((pnpmDeps, [name, depInfo]) => {
            const version = this.normalizeVersion(name, depInfo.version, isDev);
            pnpmDeps[name] = version;
            return pnpmDeps;
        }, {});
    }
    // Dependency path and versions include transitive peer dependencies encapsulated in dependencies
    // e.g. '/cdktf-cli@0.20.3(ink@3.2.0)(react@17.0.2)' -> cdktf-cli@0.20.3
    excludeTransPeerDepsVersions(fullVersionStr) {
        return fullVersionStr.split('(')[0];
    }
    static isAbsoluteDepenencyPath(dependencyPath) {
        return dependencyPath[0] !== '/';
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
            const depsNormalized = Object.fromEntries(Object.entries(deps).map(([depName, depInfo]) => {
                return [depName, depInfo.version];
            }));
            return Object.assign(Object.assign({}, acc), { [key]: depsNormalized });
        }, {});
    }
}
//# sourceMappingURL=lockfile-v6.js.map