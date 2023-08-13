import { extractPkgsFromYarnLockV2 } from './extract-yarnlock-v2-pkgs.js';
import { parsePkgJson } from '../util.js';
import { buildDepGraphYarnLockV2Simple } from './build-depgraph-simple.js';
export const parseYarnLockV2Project = async (pkgJsonContent, yarnLockContent, options, workspaceArgs) => {
    const { includeDevDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, } = options;
    const pkgs = extractPkgsFromYarnLockV2(yarnLockContent);
    const pkgJson = parsePkgJson(pkgJsonContent);
    const depgraph = await buildDepGraphYarnLockV2Simple(pkgs, pkgJson, {
        includeDevDeps,
        strictOutOfSync,
        includeOptionalDeps,
        pruneWithinTopLevelDeps,
    }, workspaceArgs);
    return depgraph;
};
//# sourceMappingURL=simple.js.map