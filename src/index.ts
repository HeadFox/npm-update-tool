import generateMd from './generateMd';
import readConfig from './readConfig';
import updateTool from './updateTool';

readConfig('./.nutrc.js').then((options) => {
  updateTool(options).then(async ({ groupList }) => {
    generateMd(groupList);
  });
});
