import { PkgIdentifier } from '../types.js';
import { Dependencies } from '../util.js';
export declare type PnpmDepPath = string;
export declare type PnpmLockPkg = {
    name?: string;
    version?: string;
    id?: string;
    dev: boolean;
    optional?: boolean;
    dependencies: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    os?: string;
    cpu?: string;
    deprecated?: boolean;
    bundledDependencies?: Record<string, string>;
    requiresBuild?: boolean;
    prepare?: boolean;
    hasBin?: boolean;
};
export declare type NormalisedPnpmPkg = {
    name: string;
    version: string;
    id: string;
    isDev: boolean;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    optionalDependencies?: Record<string, string>;
};
export declare type PnpmNode = {
    name: string;
    version: string;
    id: string;
    isDev: boolean;
    dependencies: Dependencies;
    optionalDependencies?: Dependencies;
    missingLockFileEntry?: boolean;
};
export declare type NormalisedPnpmPkgs = Record<PkgIdentifier, NormalisedPnpmPkg>;
export declare type PnpmDeps = Record<string, {
    name: string;
    version: string;
    specifier?: string;
    isDev: boolean;
}>;
export declare type ParsedDepPath = {
    name?: string;
    version?: string;
};
export declare type PnpmWorkspacePath = string;
export declare type DepName = string;
export declare type DepVersion = string;
export declare type PnpmImporter = Record<DepName, DepVersion>;
export declare type PnpmImporters = Record<PnpmWorkspacePath, Record<DepName, DepVersion>>;
