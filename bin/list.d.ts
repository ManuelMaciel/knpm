export declare type DependenciesMap = {
    [dependency: string]: string;
};
export declare type PackageJson = {
    dependencies?: DependenciesMap;
    devDependencies?: DependenciesMap;
};
export declare const list: (rootManifest: PackageJson) => Promise<{
    topLevel: {
        [name: string]: {
            url: string;
            version: string;
        };
    };
    unsatisfied: {
        name: string;
        parent: string;
        url: string;
    }[];
}>;
