import { Promise as PB } from 'bluebird';
import { findUp } from 'find-up';
import { readJson, writeJsonSync } from 'fs-extra';
import { Arguments } from 'yargs';
import { TARGET } from './constant';
import { install } from './install';
import { list, PackageJson } from './list';
import { readLock } from './lock';
import { prepareInstall } from './logger';
import { sortKeys } from './utils';

export const main = async (args: Arguments) => {
  const jsonPath = await findUp('package.json');
  if (!jsonPath) throw new Error('Could not find package.json');
  const root = (await readJson(jsonPath)) as PackageJson;

  // If you run `knpm install <packageName>`, make it work like `npm install` or `yarn add
  const additionalPackages = args._.slice(1); // ['package0', 'package1', ...]
  if (!!additionalPackages.length) {
    if (args['save-dev'] || args.dev) {
      // devDependencies
      root.devDependencies ||= {};
      // Since the version is not identified at this time, leave the version blank and write after the information is retrieved
      additionalPackages.forEach((pkg) => (root.devDependencies![pkg] = ''));
    } else {
      // dependencies
      root.dependencies ||= {};
      // Since the version is not identified at this time, leave the version blank and write after the information is retrieved
      additionalPackages.forEach((pkg) => (root.dependencies![pkg] = ''));
    }
  }

  // devDependencies are not installed in production mode
  if (args.production) delete root.devDependencies;

  // Read dependencies if lockfile is available
  readLock();

  // List packages to be installed, taking into account dependencies
  const info = await list(root);

  // Writes the constructed dependencies to lockfile
  prepareInstall(Object.keys(info.topLevel).length + info.unsatisfied.length);

  // Install top-level packages
  await PB.each(Object.entries(info.topLevel), async ([name, { url }]) => {
    await install(name, url);
  });

  // Install packages with conflicts
  await PB.each(info.unsatisfied, async (item) => {
    await install(item.name, item.url, `/${TARGET}/${item.parent}`);
  });

  beautifyPackageJson(root);

  writeJsonSync(jsonPath, root, { spaces: 2 }); // Save package.json
};

const beautifyPackageJson = (packageJson: PackageJson) => {
  if (packageJson.dependencies) {
    packageJson.dependencies = sortKeys(packageJson.dependencies);
  }

  if (packageJson.devDependencies) {
    packageJson.devDependencies = sortKeys(packageJson.devDependencies);
  }
};
