import { Promise as PB } from 'bluebird';
import { maxSatisfying, satisfies } from 'semver';
import { TARGET } from './constant';
import { getItem, updateOrCreate } from './lock';
import { logResolver } from './logger';
import { resolve } from './resolve';

/**
 * packagename -> version
 */
export type DependenciesMap = {
  [dependency: string]: string;
};

/**
 * Data structure representing dependencies on a stack in the process of tracing package dependencies
 * [Parents, children, grandchildren, great-grandchildren, great-great-grandchildren, ...]
 */
type DependencyStack = {
  name: string;
  version: string;
  dependencies: { [dep: string]: string }; // package -> version
}[];

/**
 * dep,devDep contents of package.json and corresponding buffer-like data
 * When updating the contents of package.json, write to an instance of this type, and this instance will be flushed to package.json at the end
 */
export type PackageJson = {
  dependencies?: DependenciesMap; // package -> version
  devDependencies?: DependenciesMap; // package -> version
};

/**
 * . /node_modules/. Packages written here will be installed first.
 * Not only the one in package.json, but also its dependent packages are placed here if the dependencies are not conflicted.
 * Note: Store a flattened package tree to avoid duplicate packages
 */
const topLevel: {
  [name: string]: { url: string; version: string };
} = {};

/**
 * Some packages have node_modules in the package itself, not in the topLevel due to conflicts e.g. . /node_modules/eslint-plugin-import/node_modules
 * Store packages with conflicting dependencies along with their parent (source) packages
 */
const unsatisfied: { name: string; parent: string; url: string }[] = [];

/**
 * Recurrently collect dependencies
 * Collected dependencies are stored in `topLevel` and `unsatisfied`.
 * @param {string} name - Get package name, dependencies of this package
 * @param {string} constraint - Version Constraints e.g. "0.1.0", "^7.3.5"
 * @param {DependencyStack} stack - Ancestor packages of the NAME package
 */
const collectDeps = async (name: string, constraint: string, stack: DependencyStack = []) => {
  // Get the Manifest of the package
  const fromLock = getItem(name, constraint); // Get manifest in lockfile if any.
  const manifest = fromLock || (await resolve(name));
  logResolver(name);

  // If constraint is specified, get the version that matches the semantic version; if not, get the latest version.
  const versions = Object.keys(manifest); // List of versions available in the npm registry e.g. ["0.1.0", "0.1.1", "1.0.0", ...].
  const matched = constraint ? maxSatisfying(versions, constraint) : versions[versions.length - 1];
  if (!matched) throw new Error('Cannot resolve suitable package.');

  switch (true as boolean) {
    case !topLevel[name]: // If it is not in topLevel, put it in topLevel.
      topLevel[name] = { url: manifest[matched].dist.tarball, version: matched };
      break;

    case satisfies(topLevel[name].version, constraint): // The same package compatible with topLevel exists.
      const conflictIndex = checkStackDependencies(name, matched, stack);
      if (conflictIndex === -1) {
        // Cannot be placed anywhere in the ancestry.
        return;
      }

      const parent = stack
        .map((name) => name)
        .slice(conflictIndex - 2) // Why -2?
        .join(`/${TARGET}`); // p1/node_modules/p2/node_modules/p3
      unsatisfied.push({
        name,
        parent,
        url: manifest[matched].dist.tarball,
      });
      break;

    default:
      // The same package already exists in topLevel, but it is not compatible (does not meet the semantic version)
      unsatisfied.push({
        name,
        parent: stack[stack.length - 1].name, // pkg (.../pkg/node_modules/${name})
        url: manifest[matched].dist.tarball,
      });
      break;
  }

  // Dependency Collection
  const dependencies = manifest[matched].dependencies || {};

  // Save Manifest to newLock
  updateOrCreate(`${name}@${constraint}`, {
    version: matched,
    url: manifest[matched].dist.tarball,
    shasum: manifest[matched].dist.shasum,
    dependencies,
  });

  // Since the goal is to get the dependency tree to the end, we also need to collect recurrent dependency dependencies
  if (!!Object.keys(dependencies).length) {
    stack.push({
      name,
      version: matched,
      dependencies,
    });
    await PB.all(
      Object.entries(dependencies)
        .filter(([dep, range]) => !hasCirculation(dep, range, stack))
        .map(([dep, range]) => collectDeps(dep, range, stack.slice())),
    );
    stack.pop();
  }

  // Returns a range of semantic versions to add the missing semantic version range in package.json
  if (!constraint) {
    return { name, version: `^${matched}` };
  }
};

/**
 * returns an index of ancestor packages that do not conflict with the package specified by `name` (not using name or using name but semantically OK)
 *
 * Due to the behavior of node.js, we want to place the package in node_modules as close to the ancestor as possible, so we search for a hierarchy where we can place the package by looking at the ancestor from the top.
 *
 * @param {string} name - Package name
 * @param {string} version - Semantic version
 * @param {DependencyStack} stack - Ancestor packages
 * @return {number} conflictIndex - -1: all ancestors use name, but that name is not semantically versionable
 */
const checkStackDependencies = (name: string, version: string, stack: DependencyStack): number => {
  return stack.findIndex(({ dependencies }) => {
    if (!dependencies[name]) return true; // Package is not dependent on

    return satisfies(version, dependencies[name]); // Dependent.
  });
};

/**
 * Whether the dependency is cyclical or not.
 * If a package exists in the stack and it satisfies the semantic version, the dependency is circular
 * Example: Stack [p0 -> p1 -> p2 -> p3 -> p4 -> p3].
 */
const hasCirculation = (name: string, range: string, stack: DependencyStack) => {
  return stack.some((item) => item.name === name && satisfies(item.version, range));
};

/**
 * Build a list of packages to be installed based on dep, devDep in package.json
 * For both dep and devdep, when the package name and semantic version are returned, they need to be added to the `package.json` file (necessary when adding new packages)
 */
export const list = async (rootManifest: PackageJson) => {
  if (rootManifest.dependencies) {
    const res = await PB.map(
      Object.entries(rootManifest.dependencies), // [[pkg, version], [pkg, version], ...]
      async ([name, version]) => await collectDeps(name, version),
    ).filter(Boolean); // filter(Boolean) to remove false things (like null) from the array

    // When the package name and semantic version are returned, add them to the `package.json` file
    res.forEach((item) => (rootManifest.dependencies![item!.name] = item!.version)); // eslint-disable-line
  }

  if (rootManifest.devDependencies) {
    const res = await PB.map(
      Object.entries(rootManifest.devDependencies),
      async ([name, version]) => await collectDeps(name, version),
    ).filter(Boolean); // filter(Boolean) to remove falsy things (like null) from the array

    // When the package name and semantic version are returned, add them to the `package.json` file
    res.forEach((item: any) => (rootManifest.devDependencies![item.name] = item.version)); // eslint-disable-line
  }

  return { topLevel, unsatisfied };
};
