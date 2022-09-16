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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = void 0;
const fs_extra_1 = require("fs-extra");
const node_fetch_1 = __importDefault(require("node-fetch"));
const tar_1 = require("tar");
const constant_1 = require("./constant");
const logger_1 = require("./logger");
const install = (name, url, location = '') => __awaiter(void 0, void 0, void 0, function* () {
    const path = `${process.cwd()}${location}/${constant_1.TARGET}/${name}`;
    (0, fs_extra_1.mkdirpSync)(path);
    const res = yield (0, node_fetch_1.default)(url);
    res.body ? res.body.pipe((0, tar_1.extract)({ cwd: path, strip: 1 })).on('close', logger_1.tickInstalling) : null;
});
exports.install = install;
//# sourceMappingURL=install.js.map