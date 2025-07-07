import { parsePkgJson } from '../util.mjs';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.mjs';
import { getPnpmLockfileParser } from './lockfile-parser/index.mjs';
export const parsePnpmProject = async (pkgJsonContent, pnpmLockContent, options, lockfileVersion) => {
    const { includeDevDeps, includePeerDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    let importer = '';
    const pkgJson = parsePkgJson(pkgJsonContent);
    const lockFileParser = getPnpmLockfileParser(pnpmLockContent, lockfileVersion);
    // Lockfile V9 simple project has the root importer
    if (lockFileParser.lockFileVersion.startsWith('9')) {
        importer = '.';
        lockFileParser.workspaceArgs = {
            projectsVersionMap: {
                '.': { name: pkgJson.name, version: pkgJson.version },
            },
            isWorkspace: true,
        };
    }
    const depgraph = await buildDepGraphPnpm(lockFileParser, pkgJson, {
        includeDevDeps,
        strictOutOfSync,
        includePeerDeps,
        includeOptionalDeps,
        pruneWithinTopLevelDeps,
    }, importer);
    return depgraph;
};
//# sourceMappingURL=parse-project.js.map