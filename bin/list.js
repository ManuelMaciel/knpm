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
exports.list = void 0;
const bluebird_1 = require("bluebird");
const semver_1 = require("semver");
const constant_1 = require("./constant");
const lock_1 = require("./lock");
const logger_1 = require("./logger");
const resolve_1 = require("./resolve");
const topLevel = {};
const unsatisfied = [];
const collectDeps = (name, constraint, stack = []) => __awaiter(void 0, void 0, void 0, function* () {
    const fromLock = (0, lock_1.getItem)(name, constraint);
    const manifest = fromLock || (yield (0, resolve_1.resolve)(name));
    (0, logger_1.logResolver)(name);
    const versions = Object.keys(manifest);
    const matched = constraint ? (0, semver_1.maxSatisfying)(versions, constraint) : versions[versions.length - 1];
    if (!matched)
        throw new Error('Cannot resolve suitable package.');
    switch (true) {
        case !topLevel[name]:
            topLevel[name] = { url: manifest[matched].dist.tarball, version: matched };
            break;
        case (0, semver_1.satisfies)(topLevel[name].version, constraint):
            const conflictIndex = checkStackDependencies(name, matched, stack);
            if (conflictIndex === -1) {
                return;
            }
            const parent = stack
                .map((name) => name)
                .slice(conflictIndex - 2)
                .join(`/${constant_1.TARGET}`);
            unsatisfied.push({
                name,
                parent,
                url: manifest[matched].dist.tarball,
            });
            break;
        default:
            unsatisfied.push({
                name,
                parent: stack[stack.length - 1].name,
                url: manifest[matched].dist.tarball,
            });
            break;
    }
    const dependencies = manifest[matched].dependencies || {};
    (0, lock_1.updateOrCreate)(`${name}@${constraint}`, {
        version: matched,
        url: manifest[matched].dist.tarball,
        shasum: manifest[matched].dist.shasum,
        dependencies,
    });
    if (!!Object.keys(dependencies).length) {
        stack.push({
            name,
            version: matched,
            dependencies,
        });
        yield bluebird_1.Promise.all(Object.entries(dependencies)
            .filter(([dep, range]) => !hasCirculation(dep, range, stack))
            .map(([dep, range]) => collectDeps(dep, range, stack.slice())));
        stack.pop();
    }
    if (!constraint) {
        return { name, version: `^${matched}` };
    }
});
const checkStackDependencies = (name, version, stack) => {
    return stack.findIndex(({ dependencies }) => {
        if (!dependencies[name])
            return true;
        return (0, semver_1.satisfies)(version, dependencies[name]);
    });
};
const hasCirculation = (name, range, stack) => {
    return stack.some((item) => item.name === name && (0, semver_1.satisfies)(item.version, range));
};
const list = (rootManifest) => __awaiter(void 0, void 0, void 0, function* () {
    if (rootManifest.dependencies) {
        const res = yield bluebird_1.Promise.map(Object.entries(rootManifest.dependencies), ([name, version]) => __awaiter(void 0, void 0, void 0, function* () { return yield collectDeps(name, version); })).filter(Boolean);
        res.forEach((item) => (rootManifest.dependencies[item.name] = item.version));
    }
    if (rootManifest.devDependencies) {
        const res = yield bluebird_1.Promise.map(Object.entries(rootManifest.devDependencies), ([name, version]) => __awaiter(void 0, void 0, void 0, function* () { return yield collectDeps(name, version); })).filter(Boolean);
        res.forEach((item) => (rootManifest.devDependencies[item.name] = item.version));
    }
    return { topLevel, unsatisfied };
});
exports.list = list;
//# sourceMappingURL=list.js.map