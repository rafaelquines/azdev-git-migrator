"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const azdev = __importStar(require("azure-devops-node-api"));
const inquirer = __importStar(require("inquirer"));
const string_format_1 = __importDefault(require("string-format"));
const shell = __importStar(require("shelljs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const inactivedRepositoriesPattern = "_MIGRATED";
async function execMigrator() {
    var _a;
    try {
        console.log('\n----- AZURE DEVOPS - GIT MIGRATOR -----\n');
        const { organization } = await inquirer.prompt([
            {
                type: 'input',
                name: 'organization',
                message: constants_1.orgQuestion,
            },
        ]);
        const orgUrl = (0, string_format_1.default)(constants_1.orgUrlPattern, { org: organization });
        const { personalAccessToken } = await inquirer.prompt([
            {
                type: 'password',
                name: 'personalAccessToken',
                mask: '*',
                message: (0, constants_1.accessTokenQuestion)(organization),
            },
        ]);
        const webApi = await getWebApi(orgUrl, personalAccessToken);
        const coreApi = await webApi.getCoreApi();
        const gitApi = await webApi.getGitApi();
        const availableSrcProjects = await listProjects(coreApi);
        const { srcProjectName } = await inquirer.prompt([
            {
                type: 'list',
                name: 'srcProjectName',
                message: constants_1.srcProjectQuestion,
                choices: buildProjectList(availableSrcProjects),
            }
        ]);
        const availableSrcRepositories = await listRepositories(gitApi, srcProjectName, true);
        const { srcRepositories } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'srcRepositories',
                message: constants_1.srcRepositoryQuestion,
                choices: availableSrcRepositories.map((p) => p.name),
            }
        ]);
        const { dstProjectName } = await inquirer.prompt([
            {
                type: 'list',
                name: 'dstProjectName',
                message: constants_1.dstProjectQuestion,
                choices: buildProjectList(availableSrcProjects.filter((p) => p.name !== srcProjectName)),
            }
        ]);
        for await (const srcRepository of srcRepositories) {
            const cloneRepositoryPath = path.join(os.tmpdir(), `${srcRepository}.git`);
            shell.exec(`git clone --mirror ${(_a = availableSrcRepositories.find(r => r.name === srcRepository)) === null || _a === void 0 ? void 0 : _a.sshUrl} ${cloneRepositoryPath}`);
            const dstRepository = srcRepository;
            console.log(`Creating repository ${dstRepository} in project ${dstProjectName}...`);
            const newRepo = await createRepository(webApi, dstRepository, dstProjectName);
            console.log(`Repository ${newRepo.name} created successfully!`);
            console.log('Updating repository...');
            shell.exec(`cd ${cloneRepositoryPath} && git push --mirror ${newRepo.sshUrl} && cd -`);
            console.log(`\n\nClone URLs:\n\tHTTPS: ${newRepo.remoteUrl}\n\tSSH: ${newRepo.sshUrl}\n\n`);
            const newSrcRepositoryName = `${srcRepository}_MIGRATED_TO_${dstProjectName}`;
            console.log('Renaming Source Repository...');
            const oldRepo = availableSrcRepositories.find((r) => r.name === srcRepository);
            await renameRepository(webApi, oldRepo.id, newSrcRepositoryName, srcProjectName);
            console.log('Deleting local repository...');
            shell.exec(`rm -rf ${cloneRepositoryPath}`);
        }
        console.log('Migration completed successfully');
    }
    catch (err) {
        console.log('Error', err);
    }
}
function buildProjectList(projects) {
    return projects.map((p) => {
        const name = getShortDescription(p) ? `${p.name} - ${getShortDescription(p)}` : p.name;
        return {
            name,
            value: p.name,
            short: p.name,
        };
    });
}
async function listProjects(coreApi) {
    const projects = await coreApi.getProjects();
    return projects.sort((a, b) => a.name > b.name && 1 || -1);
}
async function renameRepository(webApi, repositoryId, newName, projectName) {
    const gitApi = await webApi.getGitApi();
    return gitApi.updateRepository({
        name: newName
    }, repositoryId, projectName);
}
async function createRepository(webApi, name, project) {
    const gitApi = await webApi.getGitApi();
    return gitApi.createRepository({
        name,
    }, project);
}
function getShortDescription(project) {
    var _a;
    if (project.description) {
        if (((_a = project.description) === null || _a === void 0 ? void 0 : _a.indexOf("\n")) !== -1) {
            return project.description.substr(0, project.description.indexOf("\n")).substr(0, 100);
        }
        return project.description.length <= 100 ? project.description : project.description.substr(0, 100);
    }
    return undefined;
}
async function listRepositories(gitApi, projectName, filter = false) {
    let repositories = await gitApi.getRepositories(projectName);
    if (filter) {
        repositories = repositories.filter((r) => { var _a; return ((_a = r.name) === null || _a === void 0 ? void 0 : _a.indexOf(inactivedRepositoriesPattern)) === -1; });
    }
    return repositories.sort((a, b) => a.name > b.name && 1 || -1);
}
async function getWebApi(orgUrl, token) {
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    return new azdev.WebApi(orgUrl, authHandler);
}
async function run() {
    await execMigrator();
}
exports.run = run;
//# sourceMappingURL=index.js.map