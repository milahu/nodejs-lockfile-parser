import { LockfileType } from '../parsers/index.js';
export declare const LOCK_FILE_NAME: {
    npm: string;
    npm7: string;
    yarn: string;
    yarn2: string;
    pnpm: string;
};
export declare const INSTALL_COMMAND: {
    npm: string;
    npm7: string;
    yarn: string;
    yarn2: string;
    pnpm: string;
};
export declare class OutOfSyncError extends Error {
    code: number;
    name: string;
    dependencyName: string;
    lockFileType: string;
    constructor(dependencyName: string, lockFileType: LockfileType);
}
