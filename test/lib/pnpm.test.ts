#!/usr/bin/env node_modules/.bin/ts-node
// Shebang is required, and file *has* to be executable: chmod +x file.test.js
// See: https://github.com/tapjs/node-tap/issues/313#issuecomment-250067741
import { test } from 'tap';
import * as path from 'path';

import { load, readFixture } from '../utils';
import { config } from '../../lib/config';
import { buildDepTreeFromFiles, buildDepTree, LockfileType } from '../../lib';
import { InvalidUserInputError, OutOfSyncError } from '../../lib/errors';

const SCENARIOS_WITH_FILES = [
  {
    name: 'Parse pnpm-lock.yaml',
    workspace: 'goof',
    includeDev: false,
  },
  {
    name: 'Parse pnpm-lock.yaml with dev deps only',
    workspace: 'dev-deps-only',
    includeDev: true,
  },
  {
    name: 'Parse pnpm-lock.yaml with devDependencies',
    workspace: 'goof',
    includeDev: true,
  },
  {
    name: 'Parse pnpm-lock.yaml with repeated dependency',
    workspace: 'package-repeated-in-manifest',
    includeDev: false,
  },
  {
    name: 'Parse pnpm-lock.yaml with empty dependencies and includeDev = false',
    workspace: 'missing-deps',
    includeDev: false,
  },
  {
    name: 'Parse pnpm-lock.yaml with empty dependencies and includeDev = true',
    workspace: 'missing-deps',
    includeDev: true,
  },
  {
    name: 'Parse with npm protocol',
    workspace: 'npm-protocol',
    includeDev: false,
  },
  {
    name: 'Out of sync pnpm-lock.yaml generates tree',
    workspace: 'out-of-sync',
    includeDev: false,
    strict: false,
  },
  {
    name: "'package.json' with file as version",
    workspace: 'file-as-version',
    includeDev: false,
  },
  {
    name: "Parse with 'git url' + 'ssh'",
    workspace: 'git-ssh-url-deps',
    includeDev: false,
  },
  {
    name: 'Parse with external tarball url',
    workspace: 'external-tarball',
    includeDev: false,
  },
  {
    name: 'Parse pnpm-lock.yaml with empty devDependencies',
    workspace: 'empty-dev-deps',
    includeDev: true,
  },
  {
    name: 'Parse pnpm-lock.yaml with cyclic deps',
    workspace: 'cyclic-dep-simple',
    includeDev: false,
  },
  {
    name: 'Parse pnpm-lock.yaml with missing package name',
    workspace: 'missing-name',
    includeDev: false,
  },
  {
    name: 'Parse with a basic resolution.',
    workspace: 'resolutions-simple',
    includeDev: false,
  },
  {
    name: 'Parse with a specified resolution.',
    workspace: 'specified-resolutions',
    includeDev: false,
  },
  {
    name: 'Parse with a versioned resolution.',
    workspace: 'versioned-resolutions',
    includeDev: false,
  },
  {
    name: 'Parse with a scoped resolution.',
    workspace: 'scoped-resolutions',
    includeDev: false,
  },
];

const SCENARIOS_REJECTED = [
  {
    name: 'Parse pnpm-lock.yaml with missing dependency',
    workspace: 'missing-deps-in-lock',
    expectedError: new OutOfSyncError('uptime', LockfileType.pnpm),
  },
  {
    name: 'Parse invalid pnpm-lock.yaml',
    workspace: 'invalid-files', // invalid lockfiles (no colons on eol)
    expectedError: new InvalidUserInputError(
      'pnpm-lock.yaml parsing failed with an error',
    ),
  },
  {
    name: 'Out of sync pnpm-lock.yaml strict mode',
    workspace: 'out-of-sync',
    expectedError: new OutOfSyncError('lodash', LockfileType.pnpm),
  },
];

/*

test/fixtures/cyclic-dep

 WARN  Issues with peer dependencies found
.
└─┬ rollup-plugin-babel
  └── ✕ missing peer rollup@">=0.60.0 <3"
Peer dependencies that should be installed:
  rollup@">=0.60.0 <3"  

*/

for (const scenario of SCENARIOS_WITH_FILES) {
  test(`${scenario.name} (pnpm6)`, async (t) => {
    try {
      const depTree = await buildDepTreeFromFiles(
        `${__dirname}/../fixtures/${scenario.workspace}/`,
        'package.json',
        `pnpm6/pnpm-lock.yaml`,
        scenario.includeDev,
        scenario.strict,
      );
      expect(depTree).toMatchSnapshot();
    } catch (err) {
      t.fail(err);
    }
  });
}

for (const scenario of SCENARIOS_REJECTED) {
  test(`${scenario.name} (pnpm)`, async (t) => {
    const expectedError = scenario.expectedError;
    t.rejects(
      buildDepTreeFromFiles(
        `${__dirname}/../fixtures/${scenario.workspace}/`,
        'package.json',
        `pnpm6/pnpm-lock.yaml`,
      ),
      expectedError,
      'Error is thrown',
    );
  });
}

// buildDepTree
test(`buildDepTree from string pnpm-lock.yaml (pnpm)`, async (t) => {
  const manifestFileContents = readFixture('goof/package.json');
  const lockFileContents = readFixture(`goof/pnpm6/pnpm-lock.yaml`);
  try {
    const depTree = await buildDepTree(
      manifestFileContents,
      lockFileContents,
      false,
      LockfileType.pnpm,
    );
    expect(depTree).toMatchSnapshot();
  } catch (err) {
    t.fail();
  }
});

// special case
test(`Yarn Tree size exceeds the allowed limit of 500 dependencies (pnpm)`, async (t) => {
  try {
    config.YARN_TREE_SIZE_LIMIT = 500;
    await buildDepTreeFromFiles(
      `${__dirname}/../fixtures/goof/`,
      'package.json',
      `pnpm6/pnpm-lock.yaml`,
    );
    t.fail('Expected TreeSizeLimitError to be thrown');
  } catch (err: any) {
    t.equals(err.constructor.name, 'TreeSizeLimitError');
  } finally {
    config.YARN_TREE_SIZE_LIMIT = 6.0e6;
  }
});

// Yarn v2 specific test
test('.yarnrc.yaml is missing, but still resolving to pnpm version', async (t) => {
  const depTree = await buildDepTreeFromFiles(
    `${__dirname}/../fixtures/missing-dot-yarnrc-pnpm/`,
    'package.json',
    `pnpm-lock.yaml`,
  );

  t.equal(depTree.meta?.lockfileVersion, 2, 'resolved to yarn v2');
});
