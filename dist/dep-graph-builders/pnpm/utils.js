import { LockfileType } from '../../index.js';
import { getGraphDependencies } from '../util.js';
import { valid } from 'semver';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';
import { INSTALL_COMMAND, LOCK_FILE_NAME, } from '../../errors/out-of-sync-error.js';
export const getPnpmChildNode = (name, depInfo, pkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, lockfileParser) => {
    const resolvedVersion = valid(depInfo.version) || depInfo.version === undefined
        ? depInfo.version
        : lockfileParser.excludeTransPeerDepsVersions(depInfo.version);
    const childNodeKey = `${name}@${resolvedVersion}`;
    if (!pkgs[childNodeKey]) {
        if (lockfileParser.isWorkspaceLockfile()) {
            return {
                id: childNodeKey,
                name: name,
                version: resolvedVersion,
                dependencies: {},
                isDev: depInfo.isDev,
            };
        }
        if (strictOutOfSync && !/^file:/.test(depInfo.version)) {
            const errMessage = `Dependency ${childNodeKey} was not found in ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]}. Your package.json and ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]} are probably out of sync. Please run ` +
                `"${INSTALL_COMMAND[LockfileType.pnpm]}" and try again.`;
            throw new OpenSourceEcosystems.PnpmOutOfSyncError(errMessage);
        }
        else {
            return {
                id: childNodeKey,
                name: name,
                version: resolvedVersion,
                dependencies: {},
                isDev: depInfo.isDev,
                missingLockFileEntry: true,
            };
        }
    }
    else {
        const depData = pkgs[childNodeKey];
        const dependencies = getGraphDependencies(depData.dependencies || {}, depInfo.isDev);
        const devDependencies = includeDevDeps
            ? getGraphDependencies(depData.devDependencies || {}, true)
            : {};
        const optionalDependencies = includeOptionalDeps
            ? getGraphDependencies(depData.optionalDependencies || {}, depInfo.isDev)
            : {};
        return {
            id: `${name}@${depData.version}`,
            name: name,
            version: resolvedVersion,
            dependencies: Object.assign(Object.assign(Object.assign({}, dependencies), optionalDependencies), devDependencies),
            isDev: depInfo.isDev,
        };
    }
};
//# sourceMappingURL=utils.js.map