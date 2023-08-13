import * as yarnLockfileParser from '@yarnpkg/lockfile';
export const extractPkgsFromYarnLockV1 = (yarnLockContent) => {
    return yarnLockfileParser.parse(yarnLockContent).object;
};
//# sourceMappingURL=extract-yarnlock-v1-pkgs.js.map