"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortKeys = void 0;
const sortKeys = (obj) => {
    return Object.keys(obj)
        .sort()
        .reduce((total, current) => {
        total[current] = obj[current];
        return total;
    }, {});
};
exports.sortKeys = sortKeys;
//# sourceMappingURL=utils.js.map