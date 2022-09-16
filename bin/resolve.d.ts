export declare type Manifest = {
    [version: string]: {
        dependencies?: {
            [dep: string]: string;
        };
        dist: {
            shasum: string;
            tarball: string;
        };
    };
};
export declare const resolve: (name: string) => Promise<Manifest>;
