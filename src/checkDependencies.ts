import fs from 'fs/promises';
import ncu from 'npm-check-updates';
import signale from 'signale';

const checkDependencies = async (
  actualPath: string
): Promise<{
  pkg: any;
  depList: Array<string>;
  upgraded: any;
  nbPackages: number;
}> => {
  const upgraded = await ncu.run({
    peer: true
  });
  const nbPackages = Object.keys(upgraded).length;
  signale.info(nbPackages, 'outdated packages');
  const file = await fs.readFile(`${actualPath}/package.json`, 'utf8');
  const pkg = JSON.parse(file);
  const depList = Object.keys(upgraded);

  return {
    pkg,
    depList,
    upgraded,
    nbPackages
  };
};

export default checkDependencies;
