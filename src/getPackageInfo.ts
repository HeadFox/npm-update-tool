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
  depType: 'deps' | 'dev-deps';
} => {
  const depType = pkg.dependencies[name] ? 'deps' : 'dev-deps';
  const actualDep =
    depType == 'deps' ? pkg.dependencies[name] : pkg.devDependencies[name];
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
