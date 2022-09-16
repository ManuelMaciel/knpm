"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickInstalling = exports.prepareInstall = exports.logResolver = void 0;
const log_update_1 = __importDefault(require("log-update"));
const progress_1 = __importDefault(require("progress"));
let progress;
const logResolver = (name) => {
    (0, log_update_1.default)(`[1/2] Resolving: ${name}`);
};
exports.logResolver = logResolver;
const prepareInstall = (count) => {
    (0, log_update_1.default)('[1/2] Finished resolving.');
    progress = new progress_1.default('[2/2] Installing [:bar]', {
        complete: '#',
        total: count,
    });
};
exports.prepareInstall = prepareInstall;
const tickInstalling = () => {
    progress.tick();
};
exports.tickInstalling = tickInstalling;
//# sourceMappingURL=logger.js.map