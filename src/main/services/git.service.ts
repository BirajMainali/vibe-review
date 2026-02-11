import simpleGit, { SimpleGit, StatusResult, BranchSummary, LogResult, DiffResult } from 'simple-git'

function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

export async function getStatus(repoPath: string): Promise<StatusResult> {
  return getGit(repoPath).status()
}

export async function getDiff(repoPath: string): Promise<string> {
  return getGit(repoPath).diff()
}

export async function getDiffStaged(repoPath: string): Promise<string> {
  return getGit(repoPath).diff(['--staged'])
}

export async function getDiffFile(repoPath: string, filePath: string): Promise<string> {
  return getGit(repoPath).diff(['--', filePath])
}

export async function stageFiles(repoPath: string, files: string[]): Promise<void> {
  await getGit(repoPath).add(files)
}

export async function unstageFiles(repoPath: string, files: string[]): Promise<void> {
  await getGit(repoPath).reset(['HEAD', '--', ...files])
}

export async function commit(repoPath: string, message: string): Promise<string> {
  const result = await getGit(repoPath).commit(message)
  return result.commit
}

export async function getBranches(repoPath: string): Promise<BranchSummary> {
  return getGit(repoPath).branchLocal()
}

export async function checkout(repoPath: string, branch: string): Promise<void> {
  await getGit(repoPath).checkout(branch)
}

export async function createBranch(repoPath: string, branch: string): Promise<void> {
  await getGit(repoPath).checkoutLocalBranch(branch)
}

export async function getLog(repoPath: string, maxCount = 50): Promise<LogResult> {
  return getGit(repoPath).log({ maxCount })
}

export async function getFileContent(repoPath: string, filePath: string, ref = 'HEAD'): Promise<string> {
  try {
    return await getGit(repoPath).show([`${ref}:${filePath}`])
  } catch {
    return ''
  }
}

export async function stageAll(repoPath: string): Promise<void> {
  await getGit(repoPath).add('.')
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  const status = await getGit(repoPath).status()
  return status.current || 'HEAD'
}

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    return await getGit(repoPath).checkIsRepo()
  } catch {
    return false
  }
}
