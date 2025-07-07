import { parsePkgJson } from '../util.mjs';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.mjs';
import { getPnpmLockfileParser } from './lockfile-parser/index.mjs';
import { UNDEFINED_VERSION } from './constants.mjs';
export const parsePnpmWorkspaceProject = async (pkgJsonContent, pnpmLockfileContents, options, importer, lockfileVersion) => {
    const { includeDevDeps, includePeerDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    const lockFileParser = getPnpmLockfileParser(pnpmLockfileContents, lockfileVersion);
    const pkgJson = parsePkgJson(pkgJsonContent);
    lockFileParser.workspaceArgs = {
        isWorkspace: true,
        projectsVersionMap: {
            [importer]: {
                name: pkgJson.name,
                version: pkgJson.version || UNDEFINED_VERSION,
            },
        },
    };
    const depGraph = await buildDepGraphPnpm(lockFileParser, pkgJson, {
        includeDevDeps,
        includePeerDeps,
        strictOutOfSync,
        includeOptionalDeps,
        pruneWithinTopLevelDeps,
    }, importer);
    return depGraph;
};
//# sourceMappingURL=parse-workspace-project.js.map