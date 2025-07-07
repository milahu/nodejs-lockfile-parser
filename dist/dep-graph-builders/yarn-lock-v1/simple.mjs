import { buildDepGraphYarnLockV1Simple } from './index.mjs';
import { rewriteAliasesPkgJson } from '../../aliasesPreprocessors/pkgJson.mjs';
import { rewriteAliasesInYarnLockV1 } from '../../aliasesPreprocessors/yarn-lock-v1.mjs';
import { parsePkgJson } from '../util.mjs';
import { buildDepGraphYarnLockV1SimpleCyclesPruned } from './build-depgraph-simple-pruned.mjs';
import { extractPkgsFromYarnLockV1 } from './extract-yarnlock-v1-pkgs.mjs';
export const parseYarnLockV1Project = async (pkgJsonContent, yarnLockContent, options) => {
    const { includeDevDeps, includeOptionalDeps, includePeerDeps, pruneLevel, strictOutOfSync, honorAliases, } = options;
    const pkgs = extractPkgsFromYarnLockV1(honorAliases
        ? rewriteAliasesInYarnLockV1(yarnLockContent)
        : yarnLockContent);
    const pkgJson = parsePkgJson(honorAliases ? rewriteAliasesPkgJson(pkgJsonContent) : pkgJsonContent);
    const depGraph = pruneLevel === 'cycles'
        ? await buildDepGraphYarnLockV1SimpleCyclesPruned(pkgs, pkgJson, {
            includeDevDeps,
            strictOutOfSync,
            includeOptionalDeps,
        })
        : await buildDepGraphYarnLockV1Simple(pkgs, pkgJson, {
            includeDevDeps,
            includeOptionalDeps,
            includePeerDeps,
            strictOutOfSync,
            pruneWithinTopLevelDeps: pruneLevel === 'withinTopLevelDeps',
        });
    return depGraph;
};
//# sourceMappingURL=simple.js.map