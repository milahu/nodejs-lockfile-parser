export const rewriteAliasesInYarnLockV1 = (lockfileContent) => {
    const regex = /^(\s*)"(.+?@npm:)([^"]+)":/gm;
    const lockfilePreprocessed = lockfileContent.replace(regex, '$1"$3":');
    return lockfilePreprocessed;
};
//# sourceMappingURL=yarn-lock-v1.js.map