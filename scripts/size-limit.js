// This file helps size-limit to measure library size correctly(prevents tree-shaking)
// see https://github.com/ai/size-limit/issues/265

const path = require('path');
const fs = require('fs');

const filePath = path.join(`${__dirname}`, '../', 'dist', '__measure.js');

function createMeasurer() {
  fs.writeFileSync(
    filePath,
    "import * as all from './es/index.js'; console.log(all);",
    { encoding: 'utf-8' },
  );
}

function deleteMeasurer() {
  fs.unlinkSync(filePath);
}

module.exports = { createMeasurer, deleteMeasurer };
