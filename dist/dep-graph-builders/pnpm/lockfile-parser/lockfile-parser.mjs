import { valid } from 'semver';
import * as pathUtil from 'path';
import { isEmpty } from 'lodash';
import * as debugModule from 'debug';
import { UNDEFINED_VERSION } from '../constants.mjs';
const debug = debugModule('snyk-pnpm-workspaces');
export class PnpmLockfileParser {
    constructor(rawPnpmLock, workspaceArgs) {
        this.rawPnpmLock = rawPnpmLock;
        this.lockFileVersion = rawPnpmLock.lockfileVersion;
        this.workspaceArgs = workspaceArgs;
        this.packages = rawPnpmLock.packages || {};
        this.extractedPackages = {};
        this.resolvedPackages = {};
        this.importers = this.normaliseImporters(rawPnpmLock);
    }
    isWorkspaceLockfile() {
        var _a;
        return (_a = this.workspaceArgs) === null || _a === void 0 ? void 0 : _a.isWorkspace;
    }
    extractPackages() {
        // Packages should be parsed only one time for a parser
        if (Object.keys(this.extractedPackages).length > 0) {
            return this.extractedPackages;
        }
        const packages = {};
        Object.entries(this.packages).forEach(([depPath, versionData]) => {
            // name and version are optional in version data - if they don't show up in version data, they can be deducted from the dependency path
            const { name, version } = versionData;
            let parsedPath = {};
            // Exclude transitive peer deps from depPath
            // e.g. '/cdktf-cli@0.20.3(ink@3.2.0)(react@17.0.2)' -> cdktf-cli@0.20.3
            depPath = this.excludeTransPeerDepsVersions(depPath);
            if (!(version && name)) {
                parsedPath = this.parseDepPath(depPath);
            }
            const pkg = {
                id: depPath,
                name: name || parsedPath.name,
                version: version || parsedPath.version || depPath,
                isDev: versionData.dev == 'true',
                dependencies: versionData.dependencies || {},
                devDependencies: versionData.devDependencies || {},
                optionalDependencies: versionData.optionalDependencies || {},
            };
            packages[`${pkg.name}@${pkg.version}`] = pkg;
            this.resolvedPackages[depPath] = `${pkg.name}@${pkg.version}`;
        });
        return packages;
    }
    extractTopLevelDependencies(options, importer) {
        var _a, _b;
        let root = this.rawPnpmLock;
        if (importer) {
            const { name, version } = (_a = this.workspaceArgs) === null || _a === void 0 ? void 0 : _a.projectsVersionMap[importer];
            if (
            // Return early because dependencies were already normalized for this importer
            // as part of another's importer dependency and stored in extractedPackages
            this.extractedPackages[`${name}@${version}`] &&
                this.extractedPackages[`${name}@${version}`].localWorkspacePackage &&
                !isEmpty(this.extractedPackages[`${name}@${version}`].dependencies)) {
                return this.normalizedPkgToTopLevel(this.extractedPackages[`${name}@${version}`]);
            }
            root = this.rawPnpmLock.importers[importer];
        }
        const prodDeps = this.normalizeTopLevelDeps(root.dependencies || {}, false, importer);
        const devDeps = options.includeDevDeps
            ? this.normalizeTopLevelDeps(root.devDependencies || {}, true, importer)
            : {};
        const optionalDeps = options.includeOptionalDeps
            ? this.normalizeTopLevelDeps(root.optionalDependencies || {}, false, importer)
            : {};
        const peerDeps = options.includePeerDeps
            ? this.normalizeTopLevelDeps(root.peerDependencies || {}, false, importer)
            : {};
        if (importer) {
            const { name, version } = (_b = this.workspaceArgs) === null || _b === void 0 ? void 0 : _b.projectsVersionMap[importer];
            this.extractedPackages[`${name}@${version}`] = {
                id: `${name}@${version}`,
                name: name,
                version: version,
                dependencies: this.topLevelDepsToNormalizedPkgs(prodDeps),
                devDependencies: this.topLevelDepsToNormalizedPkgs(devDeps),
                optionalDependencies: this.topLevelDepsToNormalizedPkgs(optionalDeps),
                isDev: false,
                localWorkspacePackage: true,
            };
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({}, prodDeps), devDeps), optionalDeps), peerDeps);
    }
    normalizedPkgToTopLevel(pkg) {
        const topLevel = {};
        Object.keys(pkg.dependencies).forEach((depName) => (topLevel[depName] = {
            name: depName,
            version: pkg.dependencies[depName],
            isDev: false,
        }));
        Object.keys(pkg.devDependencies).forEach((depName) => (topLevel[depName] = {
            name: depName,
            version: pkg.devDependencies[depName],
            isDev: true,
        }));
        return topLevel;
    }
    topLevelDepsToNormalizedPkgs(deps) {
        const normalizedPkgs = {};
        Object.values(deps).forEach((dep) => (normalizedPkgs[dep.name] = dep.version));
        return normalizedPkgs;
    }
    normalizeVersion(name, version, isDev, importerName) {
        if (this.isWorkspaceLockfile()) {
            version = this.resolveWorkspacesCrossReference(name, version, isDev, importerName);
        }
        if (!valid(version)) {
            version = this.excludeTransPeerDepsVersions(version);
            if (!valid(version)) {
                // for npm and git ref packages
                // they show up in packages with keys equal to the version in top level deps
                // e.g. body-parser with version github.com/expressjs/body-parser/263f602e6ae34add6332c1eb4caa808893b0b711
                if (this.packages[version]) {
                    return this.packages[version].version || version;
                }
                if (this.packages[`${name}@${version}`]) {
                    return this.packages[`${name}@${version}`].version || version;
                }
            }
        }
        return version;
    }
    resolveWorkspacesCrossReference(name, version, isDev, importerName) {
        if (!this.workspaceArgs) {
            return version;
        }
        if (version.startsWith('link:')) {
            // In  workspaces example:
            // package-b:
            //   specifier: 1.0.0
            //   version: link:../pkg-b
            const depPath = version.split('link:')[1];
            const resolvedPathDep = pathUtil
                .join(importerName || '.', depPath)
                .replace(/\\/g, '/');
            // cross referenced package, we add it to the extracted packages
            const mappedProjInfo = this.workspaceArgs.projectsVersionMap[resolvedPathDep];
            if (!mappedProjInfo) {
                debug(`Importer ${resolvedPathDep} discovered as a dependency of ${importerName} was not found in the lockfile`);
                version = UNDEFINED_VERSION;
            }
            else {
                version = mappedProjInfo.version;
            }
            if (!version) {
                version = UNDEFINED_VERSION;
            }
            // Stop recursion here if this package was already normalized and stored in extractedPackages
            if (this.extractedPackages[`${name}@${version}`]) {
                return version;
            }
            // Initialize this package before recursive calls to avoid inifinte recursion in cycles
            // We can avoid keeping a visited arrat this way
            this.extractedPackages[`${name}@${version}`] = {
                name,
                version,
                id: `${name}@${version}`,
                isDev,
                dependencies: {},
                devDependencies: {},
                localWorkspacePackage: true,
            };
            const subDeps = this.rawPnpmLock.importers[resolvedPathDep] || {
                dependencies: {},
                devDependencies: {},
                optionalDependencies: {},
            };
            const resolvedDeps = this.normalizePackagesDeps(subDeps.dependencies || {}, isDev, resolvedPathDep);
            const resolvedDevDeps = this.normalizePackagesDeps(subDeps.devDependencies || {}, true, resolvedPathDep);
            const resolvedOptionalDeps = this.normalizePackagesDeps(subDeps.optionalDependencies || {}, true, resolvedPathDep);
            this.extractedPackages[`${name}@${version}`] = {
                name,
                version,
                id: `${name}@${version}`,
                isDev,
                dependencies: resolvedDeps,
                devDependencies: resolvedDevDeps,
                optionalDependencies: resolvedOptionalDeps,
                localWorkspacePackage: true,
            };
        }
        return version;
    }
}
//# sourceMappingURL=lockfile-parser.js.map