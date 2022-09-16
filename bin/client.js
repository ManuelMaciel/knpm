"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const index_1 = require("./index");
yargs_1.default
    .usage('karmapm <command> [args]')
    .version()
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .command('install', 'Install the dependencies.', (argv) => {
    argv.option('production', {
        type: 'boolean',
        description: 'Install production dependencies only.',
    });
    argv.boolean('save-dev');
    argv.boolean('dev');
    argv.alias('D', 'dev');
    return argv;
}, index_1.main)
    .command('*', 'Install the dependencies.', (argv) => argv.option('production', {
    type: 'boolean',
    description: 'Install production dependencies only.',
}), index_1.main)
    .parse();
//# sourceMappingURL=client.js.map