"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLock = exports.writeLock = exports.getItem = exports.updateOrCreate = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const constant_1 = require("./constant");
const utils_1 = require("./utils");
const defaultLockInfo = () => {
    return {
        version: '',
        url: '',
        shasum: '',
        dependencies: {},
    };
};
const oldLock = {};
const newLock = {};
const updateOrCreate = (name, info) => {
    if (!newLock[name]) {
        newLock[name] = defaultLockInfo();
    }
    newLock[name] = info;
};
exports.updateOrCreate = updateOrCreate;
const getItem = (name, constraint) => {
    const item = oldLock[`${name}@${constraint}`];
    if (!item)
        return null;
    return {
        [item.version]: {
            dependencies: item.dependencies,
            dist: { shasum: item.shasum, tarball: item.url },
        },
    };
};
exports.getItem = getItem;
const writeLock = () => {
    fs_extra_1.default.writeFileSync(`./${constant_1.NAME}.yml`, js_yaml_1.default.dump((0, utils_1.sortKeys)(newLock), { noRefs: true }));
};
exports.writeLock = writeLock;
const readLock = () => {
    if (fs_extra_1.default.pathExistsSync(`./${constant_1.NAME}.yml`)) {
        Object.assign(oldLock, js_yaml_1.default.loadAll(fs_extra_1.default.readFileSync(`./${constant_1.NAME}.yml`, 'utf8')));
    }
};
exports.readLock = readLock;
//# sourceMappingURL=lock.js.map