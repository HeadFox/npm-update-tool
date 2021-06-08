import ncu from 'npm-check-updates';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import util from 'util';
import child_process from 'child_process';

const exec = util.promisify(child_process.exec);

const actualPath = path.resolve('.');

const getUpdatePrintNumber = ({
  upgradeType,
  oldVersion,
  newVersionSplit
}: {
  upgradeType: string;
  oldVersion: string;
  newVersionSplit: Array<string>;
}) => {
  switch (upgradeType) {
    case 'patch':
      return `${oldVersion} --> ${newVersionSplit[0]}.${newVersionSplit[1]}.**${newVersionSplit[2]}** (${upgradeType})`;
    case 'minor':
      return `${oldVersion} --> ${newVersionSplit[0]}.**${newVersionSplit[1]}.${newVersionSplit[2]}** (${upgradeType})`;
    case 'major':
      return `${oldVersion} --> **${newVersionSplit[0]}.${newVersionSplit[1]}.${newVersionSplit[2]}** (${upgradeType})`;
  }
};

interface UdpateDepInfo {
  name: string;
  oldVersion: string;
  newVersion: string;
  upgradeType: string;
  userPrint: string;
  category: string;
  testPassed: boolean;
}

interface GroupList {
  [key: string]: Array<string>;
}

const categories = [
  'babel',
  'eslint',
  'testing-library',
  '@types',
  '@ma-js-common'
];

const getUpdateList = async ({
  testCommand = 'npm run test',
  excludeFromTest
}: {
  testCommand: string;
  excludeFromTest?: Array<string>;
}): Promise<{
  list: Array<UdpateDepInfo>;
  groupList: GroupList;
}> => {
  try {
    if (!existsSync('npm-updater')) {
      await fs.mkdir('npm-updater');
      console.log('create npm-updater folder');
    }
  } catch {
    console.log('Can’t create npm-updater folder');
  }
  try {
    await fs.access('npm-updater/temp.json');
    console.log(
      'Detecting temp file, that mean you didn’t finish last check-update.'
    );
    console.log('Don’t worry I will still generate update.md file for you');
  } catch {
    console.log('');
  }

  console.log('npm install ...');
  await exec('npm install');
  console.log('Verify that test are running before upgrade deps');
  await Promise.all([exec(testCommand), exec('npm run lint'), exec('npx tsc')]);
  const upgraded = await ncu.run({
    // Pass any cli option
    // doctor: true,
    peer: true
    // Defaults:
    // jsonDeps: true
    // jsonUpgraded: true
    // silent: true,
  });
  const nbPackages = Object.keys(upgraded).length;
  console.info(nbPackages, 'outdated packages');
  const file = await fs.readFile(`${actualPath}/package.json`, 'utf8');
  const pkg = JSON.parse(file);

  const groupList: GroupList = {};

  const depList = Object.keys(upgraded);
  const newList = [];
  for (let i = 0; i < depList.length; i++) {
    const name = depList[i];
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

    let testPassed: boolean;
    try {
      console.info(name, `Install package [${i + 1}/${nbPackages}]`);
      await exec(`npm i ${name}@${newVersion} --no-save`);
      if (
        name.includes('prettier') ||
        name.includes('eslint') ||
        name.includes('stylelint')
      ) {
        console.info(name, 'Lint/prettier package, run only lint commands');
        await exec('npm run lint:fix');
      } else if (
        excludeFromTest &&
        excludeFromTest.find((item) => name.includes(item))
      ) {
        console.info(name, 'no lint/test cause package is in excludeFromTest');
      } else if (
        name === 'typescript' ||
        name === 'react-scripts' ||
        name === 'next' ||
        name.includes('rollup')
      ) {
        console.info(name, 'build/compiler related bump detected');
        console.info(name, 'run test + build');
        await exec(`${testCommand} & npm run build`);
      } else {
        console.info(name, 'run test');
        await Promise.all([
          exec('npm run lint'),
          exec(testCommand),
          exec('npx tsc')
        ]);
      }
      console.info(name, 'Install + test succeed, install it for real');
      testPassed = true;
      await exec(`npm i ${name}@${newVersion}`);
      const commitPrint = `${name}: ${oldVersion} --> ${newVersion}`;
      await exec(
        `git add . && git commit -m "chore(${depType}): bump ${commitPrint}"`
      );
    } catch (err) {
      console.info(name, 'Install + test failed, report it');
      let errorFile = `## Info \n${JSON.stringify({
        name,
        oldVersion,
        newVersion,
        upgradeType
      })}\n`;
      errorFile = errorFile.concat(`## Output \n${err.stdout}\n`);
      errorFile = errorFile.concat(`## Error\n${err.stderr}\n`);

      await fs.writeFile(
        `npm-updater/${name.replace(/[/\\?%*:|"<>]/g, '_')}-failed.log`,
        errorFile
      );
      testPassed = false;
    }

    const category =
      categories.find((category) => name.includes(category)) || 'other';

    const userPrint = `${
      testPassed ? '' : '~~'
    }\`${name}\`: ${getUpdatePrintNumber({
      upgradeType,
      oldVersion,
      newVersionSplit
    })}${testPassed ? '' : ' | failed~~'}`;

    groupList[category] = groupList[category]
      ? [...groupList[category], userPrint]
      : [userPrint];

    newList.push({
      name,
      oldVersion,
      newVersion,
      upgradeType,
      userPrint,
      category,
      testPassed
    });
    await fs.writeFile(
      'npm-updater/temp.json',
      JSON.stringify({ newList, groupList })
    );
  }

  return {
    list: newList,
    groupList
  };
};

getUpdateList({
  testCommand: 'npm run test:cover',
  excludeFromTest: ['commitlint']
}).then(async ({ groupList }) => {
  let file = '';
  let oldData: {
    list: Array<UdpateDepInfo>;
    groupList: GroupList;
  } = {
    list: [],
    groupList: {}
  };
  try {
    oldData = JSON.parse(await fs.readFile('npm-updater/temp.json', 'utf-8'));
    console.log(
      'Detecting temp file, that mean you didn’t finish last check-update.'
    );
    console.log('Don’t worry I will still generate update.md file for you');
  } catch {
    console.log('');
  }
  const fullGroupList = { ...oldData.groupList, ...groupList };
  Object.keys(fullGroupList).forEach(async (group) => {
    file = file.concat(
      `### ${group} ${group === 'other' ? 'packages' : 'related packages'}\n`
    );
    fullGroupList[group].forEach(async (dep) => {
      file = file.concat(`- ${dep}\n`);
    });
    file = file.concat('\n');
  });
  await fs.writeFile('npm-updater/update.md', file);
  await fs.rm('npm-updater/temp.json');
});
