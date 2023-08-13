import fs from 'fs';
import path from 'path';
import { Scope, parseManifestFile, LockfileType, getYarnWorkspaces, } from './parsers/index.js';
import { PackageLockParser } from './parsers/package-lock-parser.js';
import { YarnLockParser } from './parsers/yarn-lock-parser.js';
import { Yarn2LockParser } from './parsers/yarn2-lock-parser.js';
import { UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError, } from './errors/index.js';
import { buildDepGraphFromCliOutput } from './cli-parsers/index.js';
export { buildDepTree, buildDepTreeFromFiles, buildDepGraphFromCliOutput, getYarnWorkspacesFromFiles, getYarnWorkspaces, Scope, LockfileType, UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError, };
// Straight to Depgraph Functionality *************
// ************************************************
import { parseNpmLockV2Project, extractPkgsFromYarnLockV1, parseYarnLockV1Project, parseYarnLockV1WorkspaceProject, buildDepGraphYarnLockV1SimpleCyclesPruned, buildDepGraphYarnLockV1Simple, buildDepGraphYarnLockV1WorkspaceCyclesPruned, buildDepGraphYarnLockV1Workspace, extractPkgsFromYarnLockV2, parseYarnLockV2Project, buildDepGraphYarnLockV2Simple, } from './dep-graph-builders/index.js';
import { getLockfileVersionFromFile, getNpmLockfileVersion, getYarnLockfileVersion, NodeLockfileVersion, } from './utils.js';
export { parseNpmLockV2Project, extractPkgsFromYarnLockV1, parseYarnLockV1Project, parseYarnLockV1WorkspaceProject, buildDepGraphYarnLockV1SimpleCyclesPruned, buildDepGraphYarnLockV1Simple, buildDepGraphYarnLockV1WorkspaceCyclesPruned, buildDepGraphYarnLockV1Workspace, extractPkgsFromYarnLockV2, parseYarnLockV2Project, buildDepGraphYarnLockV2Simple, getLockfileVersionFromFile, getNpmLockfileVersion, getYarnLockfileVersion, NodeLockfileVersion, };
// **********************************
async function buildDepTree(manifestFileContents, lockFileContents, includeDev = false, lockfileType, strictOutOfSync = true, defaultManifestFileName = 'package.json') {
    if (!lockfileType) {
        lockfileType = LockfileType.npm;
    }
    else if (lockfileType === LockfileType.yarn) {
        lockfileType = getYarnLockfileType(lockFileContents);
    }
    let lockfileParser;
    switch (lockfileType) {
        case LockfileType.npm:
            lockfileParser = new PackageLockParser();
            break;
        case LockfileType.yarn:
            lockfileParser = new YarnLockParser();
            break;
        case LockfileType.yarn2:
            lockfileParser = new Yarn2LockParser();
            break;
        default:
            throw new InvalidUserInputError('Unsupported lockfile type ' +
                `${lockfileType} provided. Only 'npm' or 'yarn' is currently ` +
                'supported.');
    }
    const manifestFile = parseManifestFile(manifestFileContents);
    if (!manifestFile.name) {
        manifestFile.name = path.isAbsolute(defaultManifestFileName)
            ? path.basename(defaultManifestFileName)
            : defaultManifestFileName;
    }
    const lockFile = lockfileParser.parseLockFile(lockFileContents);
    return lockfileParser.getDependencyTree(manifestFile, lockFile, includeDev, strictOutOfSync);
}
async function buildDepTreeFromFiles(root, manifestFilePath, lockFilePath, includeDev = false, strictOutOfSync = true) {
    if (!root || !manifestFilePath || !lockFilePath) {
        throw new Error('Missing required parameters for buildDepTreeFromFiles()');
    }
    const manifestFileFullPath = path.resolve(root, manifestFilePath);
    const lockFileFullPath = path.resolve(root, lockFilePath);
    if (!fs.existsSync(manifestFileFullPath)) {
        throw new InvalidUserInputError('Target file package.json not found at ' +
            `location: ${manifestFileFullPath}`);
    }
    if (!fs.existsSync(lockFileFullPath)) {
        throw new InvalidUserInputError('Lockfile not found at location: ' + lockFileFullPath);
    }
    const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
    const lockFileContents = fs.readFileSync(lockFileFullPath, 'utf-8');
    let lockFileType;
    if (lockFilePath.endsWith('package-lock.json')) {
        lockFileType = LockfileType.npm;
    }
    else if (lockFilePath.endsWith('yarn.lock')) {
        lockFileType = getYarnLockfileType(lockFileContents, root, lockFilePath);
    }
    else {
        throw new InvalidUserInputError(`Unknown lockfile ${lockFilePath}. ` +
            'Please provide either package-lock.json or yarn.lock.');
    }
    return await buildDepTree(manifestFileContents, lockFileContents, includeDev, lockFileType, strictOutOfSync, manifestFilePath);
}
function getYarnWorkspacesFromFiles(root, manifestFilePath) {
    if (!root || !manifestFilePath) {
        throw new Error('Missing required parameters for getYarnWorkspacesFromFiles()');
    }
    const manifestFileFullPath = path.resolve(root, manifestFilePath);
    if (!fs.existsSync(manifestFileFullPath)) {
        throw new InvalidUserInputError('Target file package.json not found at ' +
            `location: ${manifestFileFullPath}`);
    }
    const manifestFileContents = fs.readFileSync(manifestFileFullPath, 'utf-8');
    return getYarnWorkspaces(manifestFileContents);
}
export function getYarnLockfileType(lockFileContents, root, lockFilePath) {
    if (lockFileContents.includes('__metadata') ||
        (root &&
            lockFilePath &&
            fs.existsSync(path.resolve(root, lockFilePath.replace('yarn.lock', '.yarnrc.yml'))))) {
        return LockfileType.yarn2;
    }
    else {
        return LockfileType.yarn;
    }
}
//# sourceMappingURL=index.js.map