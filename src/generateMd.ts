import fs from 'fs/promises';
import GroupList from './types/GroupList';

const generateMd = async (groupList: GroupList): Promise<void> => {
  let file = '';

  Object.keys(groupList).forEach(async (group) => {
    file = file.concat(
      `### ${group} ${group === 'other' ? 'packages' : 'related packages'}\n`
    );
    groupList[group].forEach(async (dep) => {
      file = file.concat(`- ${dep}\n`);
    });
    file = file.concat('\n');
  });
  await fs.writeFile('npm-updater/update.md', file);
};

export default generateMd;
