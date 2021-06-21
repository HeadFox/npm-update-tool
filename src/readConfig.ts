import path from 'path';
import defaultOptions, { Options } from './constants/defaultOptions';

const readConfig = async (filePath: string): Promise<Options> => {
  try {
    const { default: options } = await import(path.resolve(filePath));
    return {
      ...defaultOptions,
      ...options,
      commands: {
        ...defaultOptions.commands,
        ...options.commands
      },
      filters: {
        ...defaultOptions.filters,
        ...options.filters
      }
    };
  } catch {
    return defaultOptions;
  }
};

export default readConfig;
