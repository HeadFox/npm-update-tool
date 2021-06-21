import DepType from './enums/DepType';

const getPackageInfo = ({
  pkg,
  name,
  upgraded
}: {
  pkg: any;
  name: string;
  upgraded: any;
}): {
  oldVersion: string;
  oldVersionSplit: Array<string>;
  newVersion: string;
  newVersionSplit: Array<string>;
  upgradeType: string;
  actualDep: string;
  depType: DepType;
} => {
  const depType = pkg.dependencies[name] ? DepType.DEPS : DepType.DEPS_DEV;
  const actualDep =
    depType == DepType.DEPS
      ? pkg.dependencies[name]
      : pkg.devDependencies[name];
  const oldVersion = actualDep.replace('^', '');
  const newVersion = upgraded[name].replace('^', '');

  let upgradeType = '';

  const oldVersionSplit = oldVersion.split('.');
  const newVersionSplit = newVersion.split('.');
  if (oldVersionSplit[0] !== newVersionSplit[0]) upgradeType = 'major';
  else if (oldVersionSplit[1] !== newVersionSplit[1]) upgradeType = 'minor';
  else upgradeType = 'patch';

  return {
    oldVersion,
    oldVersionSplit,
    newVersion,
    newVersionSplit,
    upgradeType,
    actualDep,
    depType
  };
};

export default getPackageInfo;
