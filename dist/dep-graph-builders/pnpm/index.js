import { parsePkgJson } from '../util.js';
import { buildDepGraphPnpm } from './build-dep-graph-pnpm.js';
import { getPnpmLockfileParser } from './lockfile-parser/index.js';
export const parsePnpmProject = async (pkgJsonContent, pnpmLockContent, options, lockfileVersion, workspaceArgs) => {
    const { includeDevDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    const pkgJson = parsePkgJson(pkgJsonContent);
    const lockFileParser = getPnpmLockfileParser(pnpmLockContent, lockfileVersion, workspaceArgs);
    const depgraph = await buildDepGraphPnpm(lockFileParser, pkgJson, {
        includeDevDeps,
        strictOutOfSync,
        includeOptionalDeps,
        pruneWithinTopLevelDeps,
    }, workspaceArgs);
    return depgraph;
};
//# sourceMappingURL=index.js.map