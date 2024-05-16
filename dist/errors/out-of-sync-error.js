export const LOCK_FILE_NAME = {
    npm: 'package-lock.json',
    npm7: 'package-lock.json',
    yarn: 'yarn.lock',
    yarn2: 'yarn.lock',
    pnpm: 'pnpm-lock.yaml',
};
export const INSTALL_COMMAND = {
    npm: 'npm install',
    npm7: 'npm install',
    yarn: 'yarn install',
    yarn2: 'yarn install',
    pnpm: 'pnpm install',
};
export class OutOfSyncError extends Error {
    constructor(dependencyName, lockFileType) {
        super(`Dependency ${dependencyName} was not found in ` +
            `${LOCK_FILE_NAME[lockFileType]}. Your package.json and ` +
            `${LOCK_FILE_NAME[lockFileType]} are probably out of sync. Please run ` +
            `"${INSTALL_COMMAND[lockFileType]}" and try again.`);
        this.code = 422;
        this.name = 'OutOfSyncError';
        this.dependencyName = dependencyName;
        this.lockFileType = lockFileType;
        Error.captureStackTrace(this, OutOfSyncError);
    }
}
//# sourceMappingURL=out-of-sync-error.js.map