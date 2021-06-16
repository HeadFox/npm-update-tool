import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import util from 'util';
import child_process from 'child_process';
import signale, { Signale } from 'signale';
import qualityTest from './qualityTest';
import checkDependencies from './checkDependencies';
import getPackageInfo from './getPackageInfo';
import getUpdatePrintNumber from './getUpdatePrintNumber';
import UdpateDepInfo from './types/UpdateDepInfo';
import GroupList from './types/GroupList';
import { Options } from './constants/defaultOptions';

const exec = util.promisify(child_process.exec);

const actualPath = path.resolve('.');

const updateTool = async (
  options: Options
): Promise<{
  list: Array<UdpateDepInfo>;
  groupList: GroupList;
}> => {
  try {
    if (!existsSync('npm-update-tool')) {
      await fs.mkdir('npm-update-tool');
    }
  } catch {
    signale.error('Failed to create npm-update-tool folder');
  }

  const interactive = new Signale({
    interactive: true,
    scope: 'pre-quality'
  });
  try {
    signale.info('Install & quality tests before start');
    interactive.await('Installing');
    await exec('npm ci');
    await qualityTest(
      'pre-quality',
      { test: true, lint: true, build: true },
      options.commands,
      options.typescript
    );
  } catch (err) {
    interactive.error('Install & quality tests before start');
    signale.error(err.stderr);
    await fs.writeFile(
        `npm-updater/pre-quality-failed.log`,
        err.stderr
      );
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
      if (
        options.filters.lint.find((filterName) => name.includes(filterName))
      ) {
        testOptions.lint = true;
      } else if (
        options.excludes &&
        options.excludes.find((item) => name.includes(item))
      ) {
        signale.info(
          name,
          'No quality test because this package is in ignoreList'
        );
      } else if (
        options.filters.build.find((filterName) => name.includes(filterName))
      ) {
        testOptions.build = true;
        testOptions.test = true;
      } else {
        testOptions.lint = true;
        testOptions.test = true;
      }
      await qualityTest(
        name,
        testOptions,
        options.commands,
        options.typescript
      );
      testPassed = true;
      await exec('git add .');
      const commitMessage = `"chore(${depType}): ${name} ${oldVersion} to ${newVersion}"`;

      await exec(`git commit -m ${commitMessage}`);
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
      options.categories.find((category) => name.includes(category)) || 'other';

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

export default updateTool;
