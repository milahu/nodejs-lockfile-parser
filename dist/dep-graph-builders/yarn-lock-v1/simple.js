import { buildDepGraphYarnLockV1Simple } from './index.js';
import { rewriteAliasesPkgJson } from '../../aliasesPreprocessors/pkgJson.js';
import { rewriteAliasesInYarnLockV1 } from '../../aliasesPreprocessors/yarn-lock-v1.js';
import { parsePkgJson } from '../util.js';
import { buildDepGraphYarnLockV1SimpleCyclesPruned } from './build-depgraph-simple-pruned.js';
import { extractPkgsFromYarnLockV1 } from './extract-yarnlock-v1-pkgs.js';
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