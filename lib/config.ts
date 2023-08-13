import { loadConfig } from 'snyk-config';
export const config: any = loadConfig(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]}` + '../..');
