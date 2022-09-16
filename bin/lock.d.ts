import { Manifest } from './resolve';
export declare type Lock = {
    [index: string]: LockInfo;
};
declare type LockInfo = {
    version: string;
    url: string;
    shasum: string;
    dependencies: {
        [dependency: string]: string;
    };
};
export declare const updateOrCreate: (name: string, info: LockInfo) => void;
export declare const getItem: (name: string, constraint: string) => Manifest | null;
export declare const writeLock: () => void;
export declare const readLock: () => void;
export {};
