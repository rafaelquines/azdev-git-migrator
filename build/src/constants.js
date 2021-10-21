"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgUrlPattern = exports.newSrcRepositoryName = exports.renameSrcRepositoryQuestion = exports.dstRepositoryQuestion = exports.dstProjectQuestion = exports.srcRepositoryQuestion = exports.srcProjectQuestion = exports.accessTokenQuestion = exports.orgQuestion = void 0;
exports.orgQuestion = "Organization Name:";
const accessTokenQuestion = (orgName) => {
    return `Access Token (https://${orgName}.visualstudio.com/_usersSettings/tokens):`;
};
exports.accessTokenQuestion = accessTokenQuestion;
exports.srcProjectQuestion = "Source Project:";
exports.srcRepositoryQuestion = "Source Repository:";
exports.dstProjectQuestion = "Destiny Project:";
exports.dstRepositoryQuestion = "Destiny Repository:";
exports.renameSrcRepositoryQuestion = "Rename Source Repository?";
exports.newSrcRepositoryName = "New Source Repository Name:";
exports.orgUrlPattern = 'https://dev.azure.com/{org}';
//# sourceMappingURL=constants.js.map