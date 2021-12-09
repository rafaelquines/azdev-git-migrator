import * as azdev from 'azure-devops-node-api';
import { GitApi } from 'azure-devops-node-api/GitApi';
import { CoreApi } from 'azure-devops-node-api/CoreApi';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import * as inquirer from 'inquirer';
import Format from 'string-format';
import * as shell from 'shelljs';
import * as os from 'os';
import * as path from 'path';
import { accessTokenQuestion, dstProjectQuestion, dstRepositoryQuestion, newSrcRepositoryNameQuestion, orgQuestion, orgUrlPattern, renameSrcRepositoryQuestion, srcProjectQuestion, srcRepositoryQuestion } from './constants';

const inactivedRepositoriesPattern = "_MIGRATED";

async function execMigrator() {
  try {
    console.log('\n----- AZURE DEVOPS - GIT MIGRATOR -----\n');

    const { organization } = await inquirer.prompt([
      {
        type: 'input',
        name: 'organization',
        message: orgQuestion,
      },
    ]);
    const orgUrl = Format(orgUrlPattern, { org: organization });
    const { personalAccessToken } = await inquirer.prompt([
      {
        type: 'password',
        name: 'personalAccessToken',
        mask: '*',
        message: accessTokenQuestion(organization),
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
        message: srcProjectQuestion,
        choices: buildProjectList(availableSrcProjects),
      }
    ]);

    const availableSrcRepositories = await listRepositories(gitApi, srcProjectName, true);
    const { srcRepositories } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'srcRepositories',
        message: srcRepositoryQuestion,
        choices: availableSrcRepositories.map((p) => p.name),
      }
    ]);

    const { dstProjectName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dstProjectName',
        message: dstProjectQuestion,
        choices: buildProjectList(availableSrcProjects.filter((p) => p.name !== srcProjectName)),
      }
    ]);

    for await (const srcRepository of srcRepositories) {
      const cloneRepositoryPath = path.join(os.tmpdir(), `${srcRepository}.git`);
      shell.exec(`git clone --mirror ${availableSrcRepositories.find(r => r.name === srcRepository)?.sshUrl} ${cloneRepositoryPath}`);

      const dstRepository = srcRepository;
      console.log(`Creating repository ${dstRepository} in project ${dstProjectName}...`);
      const newRepo = await createRepository(webApi, dstRepository, dstProjectName);
      console.log(`Repository ${newRepo.name} created successfully!`);
      console.log('Updating repository...');
      shell.exec(`cd ${cloneRepositoryPath} && git push --mirror ${newRepo.sshUrl} && cd -`);
      console.log(`\n\nClone URLs:\n\tHTTPS: ${newRepo.remoteUrl}\n\tSSH: ${newRepo.sshUrl}\n\n`)
      const newSrcRepositoryName = `${srcRepository}_MIGRATED_TO_${dstProjectName}`;
      console.log('Renaming Source Repository...');
      const oldRepo = availableSrcRepositories.find((r) => r.name === srcRepository);
      await renameRepository(webApi, oldRepo!.id, newSrcRepositoryName, srcProjectName);
      console.log('Deleting local repository...');
      shell.exec(`rm -rf ${cloneRepositoryPath}`)
    }
    console.log('Migration completed successfully');

  } catch (err) {
    console.log('Error', err);
  }
}

function buildProjectList(projects: TeamProjectReference[]) {
  return projects.map((p) => {
    return {
      name: `${p.name} - ${getShortDescription(p)}`,
      value: p.name,
      short: p.name,
    }
  });
}

async function listProjects(coreApi: CoreApi) {
  const projects = await coreApi.getProjects();
  return projects.sort((a, b) => a.name! > b.name! && 1 || -1);
}

async function renameRepository(webApi: azdev.WebApi, repositoryId: string | undefined, newName: string, projectName: string) {
  const gitApi = await webApi.getGitApi();
  return gitApi.updateRepository({
    name: newName
  }, repositoryId as string, projectName);
}

async function createRepository(webApi: azdev.WebApi, name: string, project: string) {
  const gitApi = await webApi.getGitApi();
  return gitApi.createRepository(
    {
      name,
    },
    project
  );
}

function getShortDescription(project: TeamProjectReference) {
  if (project.description?.indexOf("\n") !== -1)
    return project.description!.substr(0, project.description!.indexOf("\n")).substr(0, 100);
  return project.description.length <= 100 ? project.description : project.description.substr(0, 100);
}

async function listRepositories(gitApi: GitApi, projectName: string, filter = false) {
  let repositories = await gitApi.getRepositories(projectName);
  if (filter) {
    repositories = repositories.filter((r) => r.name?.indexOf(inactivedRepositoriesPattern) === -1);
  }
  return repositories.sort((a, b) => a.name! > b.name! && 1 || -1);
}

async function getWebApi(orgUrl: string, token: string) {
  const authHandler = azdev.getPersonalAccessTokenHandler(token);
  return new azdev.WebApi(orgUrl, authHandler);
}

export async function run() {
  await execMigrator();
}
