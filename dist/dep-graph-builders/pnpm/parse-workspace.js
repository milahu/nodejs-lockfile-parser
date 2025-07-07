import _debugModule from 'debug';
const debugModule = _debugModule.default || _debugModule;
import * as path from 'path';
import { parsePkgJson } from '../util.js';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.js';
import { getPnpmLockfileParser } from './lockfile-parser/index.js';
import { getPnpmLockfileVersion } from '../../utils.js';
import { getFileContents } from './utils.js';
import { UNDEFINED_VERSION } from './constants.js';
const debug = debugModule('snyk-pnpm-workspaces');
// Compute project versions map
// This is needed because the lockfile doesn't present the version of
// a project that's part of a workspace, we need to retrieve it from
// its corresponding package.json
function computeProjectVersionMaps(root, targets) {
    const projectsVersionMap = {};
    for (const target of targets) {
        const directory = path.join(root, target);
        const packageJsonFileName = path.join(directory, 'package.json');
        const packageJson = getFileContents(root, packageJsonFileName);
        try {
            const parsedPkgJson = parsePkgJson(packageJson.content);
            projectsVersionMap[target] = {
                version: parsedPkgJson.version || UNDEFINED_VERSION,
                name: parsedPkgJson.name,
            };
        }
        catch (err) {
            debug(`Error getting version for project: ${packageJsonFileName}. ERROR: ${err}`);
            continue;
        }
    }
    return projectsVersionMap;
}
export const parsePnpmWorkspace = async (root, workspaceDir, options) => {
    const scannedProjects = [];
    const { includeDevDeps, includePeerDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    const pnpmLockfileContents = getFileContents(root, path.join(workspaceDir, 'pnpm-lock.yaml')).content;
    const lockfileVersion = getPnpmLockfileVersion(pnpmLockfileContents);
    const lockFileParser = getPnpmLockfileParser(pnpmLockfileContents, lockfileVersion);
    const projectVersionsMaps = computeProjectVersionMaps(workspaceDir, Object.keys(lockFileParser.importers));
    for (const importer of Object.keys(lockFileParser.importers)) {
        const resolvedImporterPath = path.join(workspaceDir, importer);
        const packagePath = path.join(resolvedImporterPath, 'package.json');
        debug(`Processing project ${packagePath} as part of a pnpm workspace`);
        const pkgJsonFile = getFileContents(root, packagePath);
        const pkgJson = parsePkgJson(pkgJsonFile.content);
        lockFileParser.workspaceArgs = {
            isWorkspace: true,
            projectsVersionMap: projectVersionsMaps,
        };
        try {
            const depGraph = await buildDepGraphPnpm(lockFileParser, pkgJson, {
                includeDevDeps,
                includePeerDeps,
                strictOutOfSync,
                includeOptionalDeps,
                pruneWithinTopLevelDeps,
            }, importer);
            const project = {
                packageManager: 'pnpm',
                targetFile: path.relative(root, pkgJsonFile.fileName),
                depGraph,
                plugin: {
                    name: 'snyk-nodejs-lockfile-parser',
                    runtime: process.version,
                },
            };
            scannedProjects.push(project);
        }
        catch (e) {
            debug(`Error process workspace: ${pkgJsonFile.fileName}. ERROR: ${e}`);
        }
    }
    return scannedProjects;
};
//# sourceMappingURL=parse-workspace.js.map