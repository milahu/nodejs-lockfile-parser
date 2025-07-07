import { LockfileV6Parser } from './lockfile-v6.mjs';
const DEFAULT_WORKSPACE_ARGS = {
    isWorkspace: true,
    projectsVersionMap: {},
};
export class LockfileV9Parser extends LockfileV6Parser {
    constructor(rawPnpmLock, workspaceArgs = DEFAULT_WORKSPACE_ARGS) {
        super(rawPnpmLock, workspaceArgs);
        this.settings = rawPnpmLock.settings;
        this.packages = {};
        this.snapshots = rawPnpmLock.snapshots || {};
        Object.entries(this.snapshots).forEach(([depPath, versionData]) => {
            const normalizedDepPath = this.excludeTransPeerDepsVersions(depPath);
            this.packages[normalizedDepPath] = Object.assign(Object.assign({}, rawPnpmLock.packages[normalizedDepPath]), versionData);
        });
    }
}
//# sourceMappingURL=lockfile-v9.js.map