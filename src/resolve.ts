import fetch from 'node-fetch';
import { REGISTRY } from './constant';

// Package Meta Information
// tarball: URL where the compressed body of the npm package is located (e.g. https://registry.npmjs.org/node-fetch/-/node-fetch-0.1.0.tgz)
export type Manifest = {
  [version: string]: {
    dependencies?: { [dep: string]: string };
    dist: { shasum: string; tarball: string };
  };
};

/**
 * Cache the package Meta information here.
 */
const cache: { [dep: string]: Manifest } = {};

/**
 * Get the Manifest (Meta information of the package) from the package name
 *
 * @param {string} name - npm package name (e.g. `node-fetch`)
 */
export const resolve = async (name: string): Promise<Manifest> => {
  if (cache[name]) {
    return cache[name];
  }

  const response = await fetch(`${REGISTRY}${name}`); // e.g. https://registry.npmjs.org/node-fetch
  const json = (await response.json()) as {
    versions: Manifest;
    error: Error;
  };
  if (json.error) throw new ReferenceError(`No such package: ${name}`);

  cache[name] = json.versions;

  return cache[name];
};
