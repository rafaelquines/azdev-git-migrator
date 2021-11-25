export const orgQuestion = "Organization Name:";
export const accessTokenQuestion = (orgName: string) => {
    return `Access Token (https://${orgName}.visualstudio.com/_usersSettings/tokens):`
}
export const srcProjectQuestion = "Source Project:"
export const srcRepositoryQuestion = "Source Repository:"
export const dstProjectQuestion = "Destiny Project:"
export const dstRepositoryQuestion = "Destiny Repository:"
export const renameSrcRepositoryQuestion = "Rename Source Repository?"
export const newSrcRepositoryNameQuestion = "New Source Repository Name:"
export const orgUrlPattern = 'https://dev.azure.com/{org}';