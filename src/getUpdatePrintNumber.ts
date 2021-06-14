const getUpdatePrintNumber = ({
  upgradeType,
  oldVersion,
  newVersionSplit
}: {
  upgradeType: string;
  oldVersion: string;
  newVersionSplit: Array<string>;
}): string => {
  switch (upgradeType) {
    case 'patch':
      return `${oldVersion} --> ${newVersionSplit[0]}.${newVersionSplit[1]}.**${newVersionSplit[2]}** (${upgradeType})`;
    case 'minor':
      return `${oldVersion} --> ${newVersionSplit[0]}.**${newVersionSplit[1]}.${newVersionSplit[2]}** (${upgradeType})`;
    case 'major':
      return `${oldVersion} --> **${newVersionSplit[0]}.${newVersionSplit[1]}.${newVersionSplit[2]}** (${upgradeType})`;
    default:
      throw new Error('something bad happend');
  }
};

export default getUpdatePrintNumber;
