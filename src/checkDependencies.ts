import fs from 'fs/promises';
import ncu from 'npm-check-updates';
import signale from 'signale';
import { Options } from './constants/defaultOptions';

const checkDependencies = async (
  actualPath: string,
  excludes: Options['excludes']
): Promise<{
  pkg: any;
  depList: Array<string>;
  upgraded: any;
  nbPackages: number;
}> => {
  const upgraded = await ncu.run({
    peer: true,
    reject: excludes?.join(',')
  });
  const nbPackages = Object.keys(upgraded).length;
  signale.info(nbPackages, 'outdated packages');
  const file = await fs.readFile(`${actualPath}/package.json`, 'utf8');
  const pkg = JSON.parse(file);
  const depList = Object.keys(upgraded);
  if (excludes) {
    signale.warn('Exclude packages: ', excludes);
  }

  return {
    pkg,
    depList,
    upgraded,
    nbPackages
  };
};

export default checkDependencies;
