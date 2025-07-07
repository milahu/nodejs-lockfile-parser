import { load, FAILSAFE_SCHEMA } from 'js-yaml';
import { LockfileV6Parser } from './lockfile-v6.mjs';
import { LockfileV5Parser } from './lockfile-v5.mjs';
import { LockfileV9Parser } from './lockfile-v9.mjs';
import { OpenSourceEcosystems } from '@snyk/error-catalog-nodejs-public';
import { NodeLockfileVersion } from '../../../utils.mjs';
export function getPnpmLockfileParser(pnpmLockContent, lockfileVersion, workspaceArgs) {
    // In case of no dependencies, pnpm@7 (lokfile version 5)
    // does not create a lockfile at `pnpm install`
    // so if there is no lockfile content, default to lockfile version 5
    if (!pnpmLockContent) {
        return new LockfileV5Parser(pnpmLockContent, workspaceArgs);
    }
    const rawPnpmLock = load(pnpmLockContent, {
        json: true,
        schema: FAILSAFE_SCHEMA,
    });
    const version = rawPnpmLock.lockfileVersion;
    if (lockfileVersion === NodeLockfileVersion.PnpmLockV5 ||
        version.startsWith('5')) {
        return new LockfileV5Parser(rawPnpmLock, workspaceArgs);
    }
    if (lockfileVersion === NodeLockfileVersion.PnpmLockV6 ||
        version.startsWith('6')) {
        return new LockfileV6Parser(rawPnpmLock, workspaceArgs);
    }
    if (lockfileVersion === NodeLockfileVersion.PnpmLockV9 ||
        version.startsWith('9')) {
        return new LockfileV9Parser(rawPnpmLock, workspaceArgs);
    }
    throw new OpenSourceEcosystems.PnpmUnsupportedLockfileVersionError(`The pnpm-lock.yaml lockfile version ${lockfileVersion} is not supported`);
}
//# sourceMappingURL=index.js.map