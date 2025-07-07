export const extractPkgsFromNpmLockV2 = (pkgLockContent) => {
    return JSON.parse(pkgLockContent).packages;
};
//# sourceMappingURL=extract-npm-lock-v2-pkgs.js.map