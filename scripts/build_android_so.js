const { paths } = require('./tasks');
const { series, task } = require('gulp');
const chalk = require('chalk');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const { copyFileSync } = require('fs');


const buildTasks = [
  'git-submodule',
  'android-so-clean',
  'compile-polyfill',
  'generate-bindings-code',
  'build-android-mercury-lib'
];

if (os.platform() == 'win32') {
  buildTasks.push(
    'patch-windows-symbol-link-for-android'
  );
}

// Run tasks
series(
  buildTasks
)((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(chalk.green('Success.'));
  }
});
