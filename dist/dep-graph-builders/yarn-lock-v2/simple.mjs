import { extractPkgsFromYarnLockV2 } from './extract-yarnlock-v2-pkgs.mjs';
import { parsePkgJson } from '../util.mjs';
import { buildDepGraphYarnLockV2Simple } from './build-depgraph-simple.mjs';
import { rewriteAliasesPkgJson } from '../../aliasesPreprocessors/pkgJson.mjs';
import { rewriteAliasesInYarnLockV2 } from '../../aliasesPreprocessors/yarn-lock-v2.mjs';
export const parseYarnLockV2Project = async (pkgJsonContent, yarnLockContent, options, workspaceArgs) => {
    const { includeDevDeps, includeOptionalDeps, strictOutOfSync, pruneWithinTopLevelDeps, honorAliases, } = options;
    const pkgs = honorAliases
        ? rewriteAliasesInYarnLockV2(pkgJsonContent, extractPkgsFromYarnLockV2(yarnLockContent))
        : extractPkgsFromYarnLockV2(yarnLockContent);
    const pkgJson = parsePkgJson(honorAliases ? rewriteAliasesPkgJson(pkgJsonContent) : pkgJsonContent);
    const depgraph = await buildDepGraphYarnLockV2Simple(pkgs, pkgJson, {
        includeDevDeps,
        strictOutOfSync,
        includeOptionalDeps,
        pruneWithinTopLevelDeps,
    }, workspaceArgs);
    return depgraph;
};
//# sourceMappingURL=simple.js.map