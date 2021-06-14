import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import util from 'util';
import child_process from 'child_process';
import signale from 'signale';
import { runTest } from './qualityTest';
import checkDependencies from './checkDependencies';
import getPackageInfo from './getPackageInfo';
import getUpdatePrintNumber from './getUpdatePrintNumber';
import UdpateDepInfo from './types/UpdateDepInfo';
import GroupList from './types/GroupList';
import generateMd from './generateMd';
import { categories, buildFilter, lintFilter } from './constants/categories';

const exec = util.promisify(child_process.exec);

const actualPath = path.resolve('.');

const getUpdateList = async ({
  excludeFromTest
}: {
  excludeFromTest?: Array<string>;
}): Promise<{
  list: Array<UdpateDepInfo>;
  groupList: GroupList;
}> => {
  try {
    if (!existsSync('npm-updater')) {
      await fs.mkdir('npm-updater');
      signale.pending('Create npm-update-tool folder');
    }
  } catch {
    signale.error('Failed to create npm-update-tool folder');
  }

  const { pkg, depList, upgraded, nbPackages } = await checkDependencies(
    actualPath
  );

  const groupList: GroupList = {};

  const newList = [];
  for (let i = 0; i < depList.length; i++) {
    const name = depList[i];

    const { oldVersion, newVersion, newVersionSplit, upgradeType, depType } =
      getPackageInfo({
        pkg,
        name,
        upgraded
      });

    let testPassed: boolean;
    const testOptions = {
      lint: false,
      test: false,
      build: false
    };
    try {
      signale.info(name, `Install package [${i + 1}/${nbPackages}]`);
      await exec(`npm i ${name}@${newVersion}`);
      if (lintFilter.find((filterName) => name.includes(filterName))) {
        testOptions.lint = true;
      } else if (
        excludeFromTest &&
        excludeFromTest.find((item) => name.includes(item))
      ) {
        signale.info(
          name,
          'No quality test because this package is in ignoreList'
        );
      } else if (buildFilter.find((filterName) => name.includes(filterName))) {
        testOptions.build = true;
        testOptions.test = true;
      } else {
        testOptions.lint = true;
        testOptions.test = true;
      }
      await runTest(name, testOptions);
      testPassed = true;
      const commitPrint = `${name}: ${oldVersion} -> ${newVersion}`;
      await exec(
        `git add . && git commit -m "chore(${depType}): ${commitPrint}"`
      );
    } catch (err) {
      signale.error(name, 'Quality tests failed, revert + report');
      await exec('git checkout -- package.json package-lock.json');
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
  }

  return {
    list: newList,
    groupList
  };
};

getUpdateList({ excludeFromTest: ['commitlint'] }).then(
  async ({ groupList }) => {
    generateMd(groupList);
  }
);
