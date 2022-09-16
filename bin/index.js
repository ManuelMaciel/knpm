"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const bluebird_1 = require("bluebird");
const find_up_1 = require("find-up");
const fs_extra_1 = require("fs-extra");
const constant_1 = require("./constant");
const install_1 = require("./install");
const list_1 = require("./list");
const lock_1 = require("./lock");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const main = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const jsonPath = yield (0, find_up_1.findUp)('package.json');
    if (!jsonPath)
        throw new Error('Could not find package.json');
    const root = (yield (0, fs_extra_1.readJson)(jsonPath));
    const additionalPackages = args._.slice(1);
    if (!!additionalPackages.length) {
        if (args['save-dev'] || args.dev) {
            root.devDependencies || (root.devDependencies = {});
            additionalPackages.forEach((pkg) => (root.devDependencies[pkg] = ''));
        }
        else {
            root.dependencies || (root.dependencies = {});
            additionalPackages.forEach((pkg) => (root.dependencies[pkg] = ''));
        }
    }
    if (args.production)
        delete root.devDependencies;
    (0, lock_1.readLock)();
    const info = yield (0, list_1.list)(root);
    (0, logger_1.prepareInstall)(Object.keys(info.topLevel).length + info.unsatisfied.length);
    yield bluebird_1.Promise.each(Object.entries(info.topLevel), ([name, { url }]) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, install_1.install)(name, url);
    }));
    yield bluebird_1.Promise.each(info.unsatisfied, (item) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, install_1.install)(item.name, item.url, `/${constant_1.TARGET}/${item.parent}`);
    }));
    beautifyPackageJson(root);
    (0, fs_extra_1.writeJsonSync)(jsonPath, root, { spaces: 2 });
});
exports.main = main;
const beautifyPackageJson = (packageJson) => {
    if (packageJson.dependencies) {
        packageJson.dependencies = (0, utils_1.sortKeys)(packageJson.dependencies);
    }
    if (packageJson.devDependencies) {
        packageJson.devDependencies = (0, utils_1.sortKeys)(packageJson.devDependencies);
    }
};
//# sourceMappingURL=index.js.map