import { Signale } from 'signale';
import util from 'util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);

interface RunTest {
  name: string;
  options: {
    lint: boolean;
    test: boolean;
    build: boolean;
  };
}
export const runTest = async (
  name: RunTest['name'],
  { lint, test, build }: RunTest['options']
): Promise<void> => {
  const interactive = new Signale({
    interactive: true,
    scope: name
  });
  if (lint) {
    try {
      interactive.await('Linting');
      await exec('npm run lint:fix');
    } catch (err) {
      interactive.error('Linting');
      throw err;
    }
  }
  if (test) {
    try {
      interactive.await('Testing');
      await exec('npm run test');
    } catch (err) {
      interactive.error('Testing');
      throw err;
    }
  }
  if (build) {
    try {
      interactive.await('Building');
      await exec('npm run build');
    } catch (err) {
      interactive.error('Building');
      throw err;
    }
  }
  interactive.success('Quality test passed !');
};
