import { load, FAILSAFE_SCHEMA } from 'js-yaml';
import yarnCore from '@yarnpkg/core';

import { LockParserBase, DepMap } from './lock-parser-base.js';
import {
  Dep,
  Lockfile,
  LockfileType,
  ManifestDependencies,
  ManifestFile,
  PkgTree,
  Scope,
} from './index.js';
import { config } from '../config.js';
import { InvalidUserInputError } from '../errors/index.js';
import { yarnLockFileKeyNormalizer } from './yarn-utils.js';

export interface Yarn2Lock {
  type: string;
  object: Yarn2LockDeps;
  dependencies?: Yarn2LockDeps;
  lockfileType: LockfileType.yarn2;
}


export interface Yarn2LockDeps {
  [depName: string]: Yarn2LockDep
}

export interface Yarn2LockDep {
  version: string;

  resolution?: string;
  checksum?: string;
  linkType?: string;
  languageName?: string;

  dependencies?: {
    [depName: string]: string;
  };

  optionalDependencies?: {
    [depName: string]: string;
  }
}



export class Yarn2LockParser extends LockParserBase {
  constructor() {
    super(LockfileType.yarn2, config.YARN_TREE_SIZE_LIMIT);
  }

  public parseLockFile(lockFileContents: string): Yarn2Lock {
    try {
      const rawYarnLock: any = load(lockFileContents, {
        json: true,
        schema: FAILSAFE_SCHEMA,
      });

      delete rawYarnLock.__metadata;
      const dependencies: Yarn2LockDeps = {};

      const structUtils = yarnCore.structUtils;
      const parseDescriptor = structUtils.parseDescriptor;
      const parseRange = structUtils.parseRange;

      const keyNormalizer = yarnLockFileKeyNormalizer(
        parseDescriptor,
        parseRange,
      );

      Object.entries(rawYarnLock).forEach(
        ([fullDescriptor, versionData]: [string, any]) => {
          keyNormalizer(fullDescriptor).forEach((descriptor) => {
            dependencies[descriptor] = versionData;
          });
        },
      );

      return {
        dependencies,
        lockfileType: LockfileType.yarn2,
        object: dependencies,
        type: LockfileType.yarn2,
      };
    } catch (e) {
      throw new InvalidUserInputError(
        `yarn.lock parsing failed with an error: ${(e as Error).message}`,
      );
    }
  }

  public async getDependencyTree(
    manifestFile: ManifestFile,
    lockfile: Lockfile,
    includeDev = false,
    strictOutOfSync = true,
  ): Promise<PkgTree> {
    const depTree = await super.getDependencyTree(
      manifestFile,
      lockfile,
      includeDev,
      strictOutOfSync,
    );

    const meta = { lockfileVersion: 2, packageManager: 'yarn' };
    const depTreeWithMeta = {
      ...depTree,
      meta: { ...depTree.meta, ...meta },
    };

    return depTreeWithMeta;
  }

  protected getDepMap(
    lockfile: Lockfile,
    resolutions?: ManifestDependencies,
  ): DepMap {
    const yarnLockfile = lockfile as Yarn2Lock;
    const depMap: DepMap = {};

    const dependencies = (lockfile.dependencies as Yarn2LockDeps) || {};

    for (const [depName, dep] of Object.entries(yarnLockfile.object)) {
      const subDependencies = Object.entries({
        ...(dep.dependencies || {}),
        ...(dep.optionalDependencies || {}),
      }).map(
        ([key, ver]) =>
          findResolutions(dependencies, depName, key, resolutions) ||
          `${key}@${ver}`,
      );

      depMap[depName] = {
        labels: {
          scope: Scope.prod,
        },
        name: getName(depName),
        requires: subDependencies,
        version: dep.version,

        ...(dep.resolution && { resolution: dep.resolution }),
        ...(dep.checksum && { checksum: dep.checksum }),
      };
    }

    return depMap;
  }

  protected getDepTreeKey(dep: Dep): string {
    return `${dep.name}@${dep.version}`;
  }
}

function getName(depName: string) {
  return depName.slice(0, depName.indexOf('@', 1));
}

function findResolutions(
  dependencies: Yarn2LockDeps,
  depName: string,
  subDepKey: string,
  resolutions?: ManifestDependencies,
): string | undefined {
  if (!resolutions) return;

  const resolutionKeys = Object.keys(resolutions);

  const index = depName.indexOf('@', 1);
  const name = depName.slice(0, index);
  const version = depName.slice(index + 1);

  const firstMatchingResolution = resolutionKeys.find((res) => {
    if (!res.endsWith(subDepKey)) {
      return false;
    }

    const leadingPkg = res.split(subDepKey)[0].slice(0, -1);

    const noSpecifiedParent = !leadingPkg;
    const specifiedParentMatchesCurrentDep = leadingPkg === name;
    const specifiedParentWithVersionMatches =
      leadingPkg.includes(name) &&
      leadingPkg.includes(dependencies[`${name}@${version}`].version);

    return (
      noSpecifiedParent ||
      specifiedParentMatchesCurrentDep ||
      specifiedParentWithVersionMatches
    );
  });

  if (resolutionKeys && firstMatchingResolution) {
    return `${subDepKey}@${resolutions[firstMatchingResolution]}`;
  }
}
