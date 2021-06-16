#!/usr/bin/env node

import generateMd from './generateMd';
import readConfig from './readConfig';
import updateTool from './updateTool';

readConfig('./.npmutrc.js').then((options) => {
  updateTool(options).then(async ({ groupList }) => {
    generateMd(groupList);
  });
});
