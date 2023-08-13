import { extractCorrectIdentifierBySemver } from './cli-parser-utils.js';
export const parseYarnListOutput = (rawYarnListOutput, manifestDependencies) => {
    const formattedYarnList = JSON.parse(rawYarnListOutput).data.trees;
    // Reference to all (resolved) dep names to help cleanup in next step
    const names = formattedYarnList.map((tree) => tree.name);
    const formattedListOutput = formattedYarnList.reduce((result, tree) => {
        const dependencies = tree.children.map((child) => extractCorrectIdentifierBySemver(names, child.name));
        return result.set(tree.name, dependencies);
    }, new Map());
    const topLevelDeps = getTopLevelDependencies(formattedListOutput, manifestDependencies);
    return { topLevelDeps, dependencies: formattedListOutput };
};
const getTopLevelDependencies = (formattedListOutput, topLevelDeps) => {
    // This logic is to construct an item for the rootPkg because
    // we are dealing with a flat map so far so can't tell
    const names = [...formattedListOutput.keys()];
    return Object.entries(topLevelDeps).map(([name, version]) => extractCorrectIdentifierBySemver(names, `${name}@${version}`));
};
//# sourceMappingURL=yarn-list-parser.js.map