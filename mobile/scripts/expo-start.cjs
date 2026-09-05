const Module = require('module');

Module.builtinModules = Module.builtinModules.filter(
    (moduleName) => !moduleName.startsWith('node:')
);

require('../node_modules/expo/bin/cli');