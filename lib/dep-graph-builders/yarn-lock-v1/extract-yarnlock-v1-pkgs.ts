import * as yarnLockfileParser from '@yarnpkg/lockfile';
import { NormalisedPkgs } from '../types.js';

export const extractPkgsFromYarnLockV1 = (
  yarnLockContent: string,
): NormalisedPkgs => {
  return yarnLockfileParser.parse(yarnLockContent).object;
};
