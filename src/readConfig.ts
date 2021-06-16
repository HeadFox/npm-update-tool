import path from 'path';
import defaultOptions, { Options } from './constants/defaultOptions';

const readConfig = async (filePath: string): Promise<Options> => {
  try {
    const { default: options } = await import(path.resolve(filePath));
    return {
      ...defaultOptions,
      ...options
    };
  } catch {
    return defaultOptions;
  }
};

export default readConfig;
