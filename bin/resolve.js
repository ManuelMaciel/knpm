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
exports.resolve = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const constant_1 = require("./constant");
const cache = {};
const resolve = (name) => __awaiter(void 0, void 0, void 0, function* () {
    if (cache[name]) {
        return cache[name];
    }
    const response = yield (0, node_fetch_1.default)(`${constant_1.REGISTRY}${name}`);
    const json = (yield response.json());
    if (json.error)
        throw new ReferenceError(`No such package: ${name}`);
    cache[name] = json.versions;
    return cache[name];
});
exports.resolve = resolve;
//# sourceMappingURL=resolve.js.map