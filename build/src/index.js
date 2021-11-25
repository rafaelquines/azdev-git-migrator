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
const azdev = __importStar(require("azure-devops-node-api"));
const inquirer = __importStar(require("inquirer"));
const string_format_1 = __importDefault(require("string-format"));
const constants_1 = require("./constants");
async function execMigrator() {
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
        // const buildApi = await webApi.getBuildApi();
        const availableSrcProjects = await listProjects(coreApi);
        const { srcProjectName } = await inquirer.prompt([
            {
                type: 'list',
                name: 'srcProjectName',
                message: constants_1.srcProjectQuestion,
                choices: buildProjectList(availableSrcProjects),
            }
        ]);
        // console.log('Builds: ', await buildApi.getDefinitions(srcProjectName));
        const availableSrcRepositories = await listRepositories(gitApi, srcProjectName);
        const { srcRepositories } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'srcRepositories',
                message: constants_1.srcRepositoryQuestion,
                choices: availableSrcRepositories.map((p) => p.name),
            }
        ]);
        console.log(srcRepositories);
        // const cloneRepositoryPath = path.join(os.tmpdir(), `${srcRepository}.git`);
        // shell.exec(`git clone --mirror ${availableSrcRepositories.find(r => r.name === srcRepository)?.sshUrl} ${cloneRepositoryPath}`);
        // const { dstProjectName } = await inquirer.prompt([
        //   {
        //     type: 'list',
        //     name: 'dstProjectName',
        //     message: dstProjectQuestion,
        //     choices: buildProjectList(availableSrcProjects.filter((p) => p.name !== srcProjectName)),
        //   }
        // ]);
        // const { dstRepository } = await inquirer.prompt([
        //   {
        //     type: 'input',
        //     name: 'dstRepository',
        //     message: dstRepositoryQuestion,
        //     default: srcRepository,
        //     validate: async (input): Promise<boolean | string> => {
        //       const reposInProject = await listRepositories(gitApi, dstProjectName);
        //       const exists = reposInProject.find((r) => r.name === input) !== undefined;
        //       if (exists) {
        //         return `${input} repository already exists in project ${dstProjectName}!`;
        //       }
        //       return true;
        //     },
        //   },
        // ]);
        // console.log(`Creating repository ${dstRepository} in project ${dstProjectName}...`);
        // const oldRepo = availableSrcRepositories.find((r) => r.name === srcRepository);
        // const newRepo = await createRepository(webApi, dstRepository, dstProjectName);
        // console.log('Repository created successfully!');
        // console.log('Updating repository...');
        // shell.exec(`cd ${cloneRepositoryPath} && git push --mirror ${newRepo.sshUrl} && cd -`);
        // console.log(`\n\nClone URLs:\n\tHTTPS: ${newRepo.remoteUrl}\n\tSSH: ${newRepo.sshUrl}\n\n`)
        // const { willRename } = await inquirer.prompt([
        //   {
        //     type: 'confirm',
        //     name: 'willRename',
        //     message: renameSrcRepositoryQuestion,
        //   },
        // ]);
        // if (willRename) {
        //   const { newSrcRepoName } = await inquirer.prompt([
        //     {
        //       type: 'input',
        //       name: 'newSrcRepoName',
        //       message: newSrcRepositoryName,
        //       default: `${srcRepository}_MIGRATED`,
        //       validate: async (input): Promise<boolean | string> => {
        //         const reposInProject = await listRepositories(gitApi, srcProjectName);
        //         const exists = reposInProject.find((r) => r.name === input) !== undefined;
        //         if (exists) {
        //           return `${input} repository already exists in project ${srcProjectName}!`;
        //         }
        //         return true;
        //       },
        //     },
        //   ]);
        //   console.log('Renaming Source Repository...');
        //   await renameRepository(webApi, oldRepo!.id, newSrcRepoName, srcProjectName);
        // }
        // console.log('Deleting local project...');
        // shell.exec(`rm -rf ${cloneRepositoryPath}`)
        // console.log('Migration completed successfully');
    }
    catch (err) {
        console.log('Error', err);
    }
}
function buildProjectList(projects) {
    return projects.map((p) => {
        return {
            name: `${p.name} - ${getShortDescription(p)}`,
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
    if (((_a = project.description) === null || _a === void 0 ? void 0 : _a.indexOf("\n")) !== -1)
        return project.description.substr(0, project.description.indexOf("\n")).substr(0, 100);
    return project.description.length <= 100 ? project.description : project.description.substr(0, 100);
}
async function listRepositories(gitApi, projectName) {
    const repositories = await gitApi.getRepositories(projectName);
    return repositories.sort((a, b) => a.name > b.name && 1 || -1);
}
async function getWebApi(orgUrl, token) {
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    return new azdev.WebApi(orgUrl, authHandler);
}
async function run() {
    await execMigrator();
}
run();
//# sourceMappingURL=index.js.map