import { buildFilter, categories, lintFilter } from './categories';

export interface Options {
  typescript: boolean;
  commands: {
    lint: string;
    test: string;
    build: string;
  };
  filters: {
    lint: Array<string>;
    build: Array<string>;
  };
  categories: Array<string>;
  excludes?: Array<string>;
  excludesQuality?: Array<string>;
}

const defaultOptions = {
  typescript: true,
  commands: {
    lint: 'npm run lint:fix',
    test: 'npm run test',
    build: 'npm run build'
  },
  filters: {
    lint: lintFilter,
    build: buildFilter
  },
  categories,
  excludes: undefined,
  excludesQuality: undefined
};

export default defaultOptions;
