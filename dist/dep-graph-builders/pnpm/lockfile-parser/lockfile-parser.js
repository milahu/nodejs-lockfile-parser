import { valid } from 'semver';
import * as pathUtil from 'path';
export class PnpmLockfileParser {
    constructor(rawPnpmLock, workspaceArgs) {
        this.rawPnpmLock = rawPnpmLock;
        this.lockFileVersion = rawPnpmLock.lockFileVersion;
        this.workspaceArgs = workspaceArgs;
        const depsRoot = this.getRoot(rawPnpmLock);
        this.packages = rawPnpmLock.packages || {};
        this.dependencies = depsRoot.dependencies || {};
        this.devDependencies = depsRoot.devDependencies || {};
        this.optionalDependencies = depsRoot.optionalDependencies || {};
        this.peerDependencies = depsRoot.peerDependencies || {};
        this.extractedPackages = {};
        this.importers = this.normaliseImporters(rawPnpmLock);
    }
    isWorkspaceLockfile() {
        var _a;
        return (_a = this.workspaceArgs) === null || _a === void 0 ? void 0 : _a.isWorkspacePkg;
    }
    getRoot(rawPnpmLock) {
        var _a, _b;
        let depsRoot = rawPnpmLock;
        if ((_a = this.workspaceArgs) === null || _a === void 0 ? void 0 : _a.isWorkspacePkg) {
            depsRoot = rawPnpmLock.importers[this.workspaceArgs.workspacePath];
        }
        if ((_b = this.workspaceArgs) === null || _b === void 0 ? void 0 : _b.isRoot) {
            if (!this.workspaceArgs.workspacePath) {
                this.workspaceArgs.workspacePath = '.';
            }
            depsRoot = rawPnpmLock.importers[this.workspaceArgs.workspacePath];
        }
        return depsRoot;
    }
    extractPackages() {
        const packages = {};
        Object.entries(this.packages).forEach(([depPath, versionData]) => {
            // name and version are optional in version data - if they don't show up in version data, they can be deducted from the dependency path
            const { name, version } = versionData;
            let parsedPath = {};
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
        });
        return packages;
    }
    extractTopLevelDependencies(options) {
        const prodDeps = this.normalizeTopLevelDeps(this.dependencies || {}, false);
        const devDeps = options.includeDevDeps
            ? this.normalizeTopLevelDeps(this.devDependencies || {}, true)
            : {};
        const optionalDeps = options.includeOptionalDeps
            ? this.normalizeTopLevelDeps(this.optionalDependencies || {}, false)
            : {};
        const peerDeps = options.includePeerDeps
            ? this.normalizeTopLevelDeps(this.peerDependencies || {}, false)
            : {};
        return Object.assign(Object.assign(Object.assign(Object.assign({}, prodDeps), devDeps), optionalDeps), peerDeps);
    }
    normalizeVersion(name, version, isDev) {
        if (this.isWorkspaceLockfile()) {
            version = this.resolveWorkspacesCrossReference(name, version, isDev);
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
    resolveWorkspacesCrossReference(name, version, isDev) {
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
                .join(this.workspaceArgs.workspacePath, depPath)
                .replace(/\\/g, '/');
            // cross referenced package, we add it to the extracted packages
            version = this.workspaceArgs.projectsVersionMap[resolvedPathDep];
            const subDeps = this.rawPnpmLock.importers[resolvedPathDep] || {
                dependencies: {},
                devDependencies: {},
                optionalDependencies: {},
            };
            const resolvedDeps = this.normalizePackagesDeps(subDeps.dependencies || {}, isDev);
            const resolvedDevDeps = this.normalizePackagesDeps(subDeps.devDependencies || {}, true);
            const resolvedOptionalDeps = this.normalizePackagesDeps(subDeps.optionalDependencies || {}, true);
            this.extractedPackages[`${name}@${version}`] = {
                name,
                version,
                id: `${name}@${version}`,
                isDev,
                dependencies: resolvedDeps,
                devDependencies: resolvedDevDeps,
                optionalDependencies: resolvedOptionalDeps,
            };
        }
        return version;
    }
}
//# sourceMappingURL=lockfile-parser.js.map