import { mkdirpSync } from 'fs-extra';
import fetch from 'node-fetch';
import { extract } from 'tar';
import { TARGET } from './constant';
import { tickInstalling } from './logger';

export const install = async (name: string, url: string, location = '') => {
  const path = `${process.cwd()}${location}/${TARGET}/${name}`; // インストール先
  mkdirpSync(path);

  const res = await fetch(url);

  // res.body is a readable stream and `tar.extract` accepts readable streams, so there is no need to create a file on disk, only extract directly
  res.body.pipe(extract({ cwd: path, strip: 1 })).on('close', tickInstalling); // on(...) Update progress bar with
};
