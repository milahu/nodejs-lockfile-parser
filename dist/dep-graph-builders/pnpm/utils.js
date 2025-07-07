import * as path from 'path';
import * as fs from 'fs';
import { LockfileType } from '../../index.js';
import { getGraphDependencies } from '../util.js';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';
import { INSTALL_COMMAND, LOCK_FILE_NAME, } from '../../errors/out-of-sync-error.js';
import * as debugModule from 'debug';
import { UNDEFINED_VERSION } from './constants.js';
const debug = debugModule('snyk-pnpm-workspaces');
export const getPnpmChildNode = (name, depInfo, pkgs, strictOutOfSync, includeOptionalDeps, includeDevDeps, lockfileParser) => {
    const resolvedVersion = lockfileParser.excludeTransPeerDepsVersions(depInfo.version);
    let childNodeKey = `${name}@${resolvedVersion}`;
    // For aliases, the version is the dependency path that
    // shows up in the packages section of lockfiles
    if (lockfileParser.resolvedPackages[resolvedVersion]) {
        childNodeKey = lockfileParser.resolvedPackages[resolvedVersion];
    }
    if (lockfileParser.resolvedPackages[childNodeKey]) {
        childNodeKey = lockfileParser.resolvedPackages[childNodeKey];
    }
    if (!pkgs[childNodeKey]) {
        if (strictOutOfSync && !/^file:/.test(depInfo.version)) {
            const errMessage = `Dependency ${childNodeKey} was not found in ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]}. Your package.json and ` +
                `${LOCK_FILE_NAME[LockfileType.pnpm]} are probably out of sync. Please run ` +
                `"${INSTALL_COMMAND[LockfileType.pnpm]}" and try again.`;
            debug(errMessage);
            throw new OpenSourceEcosystems.PnpmOutOfSyncError(errMessage);
        }
        else {
            return {
                id: childNodeKey,
                name: name,
                version: resolvedVersion || UNDEFINED_VERSION,
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
            id: `${depData.name}@${depData.version}`,
            name: depData.name,
            version: depData.version || UNDEFINED_VERSION,
            dependencies: Object.assign(Object.assign(Object.assign({}, dependencies), optionalDependencies), devDependencies),
            isDev: depInfo.isDev,
        };
    }
};
export function getFileContents(root, fileName) {
    const fullPath = path.resolve(root, fileName);
    if (!fs.existsSync(fullPath)) {
        throw new Error('Manifest ' + fileName + ' not found at location: ' + fileName);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
        content,
        fileName,
    };
}
//# sourceMappingURL=utils.js.map