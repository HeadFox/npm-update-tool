import { Signale } from 'signale';
import util from 'util';
import child_process from 'child_process';
import { Options } from './constants/defaultOptions';
const exec = util.promisify(child_process.exec);

interface RunTest {
  name: string;
  options: {
    lint: boolean;
    test: boolean;
    build: boolean;
  };
}
const qualityTest = async (
  name: RunTest['name'],
  { lint, test, build }: RunTest['options'],
  commands: Options['commands'],
  typescript: Options['typescript']
): Promise<void> => {
  const interactive = new Signale({
    interactive: true,
    scope: name
  });
  if (lint) {
    try {
      interactive.await('Linting');
      await exec(commands.lint);
    } catch (err) {
      interactive.error('Linting');
      throw err;
    }
  }
  if (test) {
    try {
      interactive.await('Testing');
      await exec(commands.test);
    } catch (err) {
      interactive.error('Testing');
      throw err;
    }
  }
  if (build) {
    try {
      interactive.await('Building');
      await exec(commands.build);
    } catch (err) {
      interactive.error('Building');
      throw err;
    }
  }
  if (typescript) {
    try {
      interactive.await('Check typing');
      await exec('tsc');
    } catch (err) {
      interactive.error('Check typing');
      throw err;
    }
  }
  interactive.success('Quality tests passed !');
};

export default qualityTest;
