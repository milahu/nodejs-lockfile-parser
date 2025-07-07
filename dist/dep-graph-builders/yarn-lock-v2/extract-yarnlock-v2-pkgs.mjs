import { load, FAILSAFE_SCHEMA } from 'js-yaml';
import yarnCore from '@yarnpkg/core';
import { yarnLockFileKeyNormalizer } from './utils.mjs';
const structUtils = yarnCore.structUtils;
const parseDescriptor = structUtils.parseDescriptor;
const parseRange = structUtils.parseRange;
const keyNormalizer = yarnLockFileKeyNormalizer(parseDescriptor, parseRange);
export const extractPkgsFromYarnLockV2 = (yarnLockContent) => {
    const rawYarnLock = load(yarnLockContent, {
        json: true,
        schema: FAILSAFE_SCHEMA,
    });
    delete rawYarnLock.__metadata;
    const dependencies = {};
    Object.entries(rawYarnLock).forEach(([fullDescriptor, versionData]) => {
        keyNormalizer(fullDescriptor).forEach((descriptor) => {
            dependencies[descriptor] = versionData;
        });
    });
    return dependencies;
};
//# sourceMappingURL=extract-yarnlock-v2-pkgs.js.map