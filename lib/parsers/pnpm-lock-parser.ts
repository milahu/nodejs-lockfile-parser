import {
  Dep,
  Lockfile,
  LockfileType,
  ManifestFile,
  PkgTree,
  Scope,
} from './index';
import { InvalidUserInputError } from '../errors';
import { DepMap, DepMapItem, LockParserBase } from './lock-parser-base';
import { config } from '../config';

import * as Pnpm4 from '@pnpm/lockfile-types';
export * as Pnpm4 from '@pnpm/lockfile-types';
/*
  Pnpm4.Lockfile
  Pnpm4.PackageSnapshots
*/

//export { Lockfile as PnpmLock } from '@pnpm/lockfile-types';

export interface PnpmLockSpecifiers {
  [depName: string]: string;
}

export interface PnpmLockDependencies {
  [depName: string]: string;
}

export interface PnpmLockDevDependencies {
  [depName: string]: string;
}

export interface PnpmLockPackages {
  [depPath: string]: PnpmLockPackage;
}

export interface PnpmLockPackage {
  version: string;
  requires?: {
    [depName: string]: string;
  };
  dependencies?: PnpmLockDeps;
  dev?: boolean;
  hasBin?: boolean;
}
/*
    resolution: {integrity: sha512-E+iruNOY8VV9s4JEbe1aNEm6MiszPRr/UfcHMz0TQh1BXSxHK+ASV1R6W4HpjBhSeS+54PIsAMCBmwD06LLsqQ==}
    hasBin: true
    dependencies:
      jsonparse: 1.3.1
      through: 2.3.8
    dev: true
*/

export class PnpmLockParser extends LockParserBase {
  constructor() {
    super(LockfileType.npm, config.NPM_TREE_SIZE_LIMIT);
  }

  public parseLockFile(lockFileContents: string): PnpmLock {
    try {
      const packageLock: PnpmLock = JSON.parse(lockFileContents);
      packageLock.type =
        packageLock.lockfileVersion === 1
          ? LockfileType.npm
          : LockfileType.npm7;
      this.type = packageLock.type;
      return packageLock;
    } catch (e: any) {
      throw new InvalidUserInputError(
        'package-lock.json parsing failed with ' + `error ${e.message}`,
      );
    }
  }

  public async getDependencyTree(
    manifestFile: ManifestFile,
    lockfile: Lockfile,
    includeDev: boolean = false,
    strictOutOfSync: boolean = true,
  ): Promise<PkgTree> {
    const dependencyTree = await super.getDependencyTree(
      manifestFile,
      lockfile,
      includeDev,
      strictOutOfSync,
    );
    const meta = {
      lockfileVersion: (lockfile as PnpmLock).lockfileVersion,
      packageManager: 'npm',
    };
    const depTreeWithMeta = {
      ...dependencyTree,
      meta: { ...dependencyTree.meta, ...meta },
    };
    return depTreeWithMeta;
  }

  protected getDepMap(lockfile: Lockfile): DepMap {
    const packageLock = lockfile as PnpmLock;
    const depMap: DepMap = {};

    const flattenLockfileRec = (
      lockfileDeps: PnpmLockDeps,
      path: string[],
    ) => {
      for (const [depName, dep] of Object.entries(lockfileDeps)) {
        const depNode: DepMapItem = {
          labels: {
            scope: dep.dev ? Scope.dev : Scope.prod,
          },
          name: depName,
          requires: [],
          version: dep.version,
        };

        if (dep.requires) {
          depNode.requires = Object.keys(dep.requires);
        }

        const depPath: string[] = [...path, depName];
        const depKey = depPath.join(this.pathDelimiter);
        depMap[depKey] = depNode;
        if (dep.dependencies) {
          flattenLockfileRec(dep.dependencies, depPath);
        }
      }
    };

    flattenLockfileRec(packageLock.dependencies || {}, []);

    return depMap;
  }

  protected getDepTreeKey(dep: Dep): string {
    return dep.name;
  }
}
