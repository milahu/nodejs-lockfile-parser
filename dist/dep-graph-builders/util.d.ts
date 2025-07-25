import { PackageJsonBase } from './types.js';
import { DepGraphBuilder } from '@snyk/dep-graph';
import { NormalisedPkgs } from './types.js';
export type Dependencies = Record<string, {
    version: string;
    isDev: boolean;
}>;
export interface PkgNode {
    id: string;
    name: string;
    version: string;
    resolved?: string;
    integrity?: string;
    dependencies: Dependencies;
    isDev: boolean;
    missingLockFileEntry?: boolean;
    inBundle?: boolean;
    key?: string;
}
export declare const addPkgNodeToGraph: (depGraphBuilder: DepGraphBuilder, node: PkgNode, options: {
    isCyclic?: boolean;
    isWorkspacePkg?: boolean;
}) => DepGraphBuilder;
/**
 * Get top level dependencies from the given package json object which is parsed from a package.json file.
 * This includes both prod dependencies and dev dependencies supposing includeDevDeps is supported.
 */
export declare const getTopLevelDeps: (pkgJson: PackageJsonBase, options: {
    includeDevDeps: boolean;
    includeOptionalDeps?: boolean;
    includePeerDeps?: boolean;
}) => Dependencies;
/**
 * Converts dependencies parsed from the a lock file to a dependencies object required by the graph.
 * For example, { 'mime-db': '~1.12.0' } will be converted to { 'mime-db': { version: '~1.12.0', isDev: true/false } }.
 */
export declare const getGraphDependencies: (dependencies: Record<string, string>, isDev: any) => Dependencies;
export declare function parsePkgJson(pkgJsonContent: string): PackageJsonBase;
export declare const getChildNode: (name: string, depInfo: {
    version: string;
    isDev: boolean;
}, pkgs: NormalisedPkgs, strictOutOfSync: boolean, includeOptionalDeps: boolean) => PkgNode;
