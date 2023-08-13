import { OutOfSyncError } from '../../errors/index.js';
import { LockfileType } from '../../parsers/index.js';
import { getChildNode } from '../util.js';
export const getChildNodeYarnLockV1Workspace = (name, depInfo, workspacePkgNameToVersion, pkgs, strictOutOfSync, includeOptionalDeps) => {
    let childNode;
    if (workspacePkgNameToVersion[name]) {
        const version = workspacePkgNameToVersion[name];
        // This is just to mimic old behavior where when StrictOutOfSync is turned on,
        // any cross referencing between workspace packages will lead to a throw
        if (strictOutOfSync) {
            throw new OutOfSyncError(`${name}@${version}`, LockfileType.yarn);
        }
        childNode = {
            id: `${name}@${version}`,
            name: name,
            version: version,
            resolved: 'FIXME nodejs-lockfile-parser/lib/dep-graph-builders/yarn-lock-v1/util.ts',
            integrity: 'lib/dep-graph-builders/yarn-lock-v1/util.ts',
            dependencies: {},
            isDev: depInfo.isDev,
        };
    }
    else {
        childNode = getChildNode(name, depInfo, pkgs, strictOutOfSync, includeOptionalDeps);
    }
    return childNode;
};
//# sourceMappingURL=util.js.map