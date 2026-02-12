import simpleGit, { SimpleGit } from 'simple-git'
import { readFile } from 'fs/promises'
import { join } from 'path'

function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

/**
 * Generate a unified-diff representation for a brand-new (untracked) file so
 * that diff2html can render it just like any other change.
 */
function generateNewFileDiff(filePath: string, content: string): string {
  const lines = content.split('\n')
  const hasTrailingNewline = content.endsWith('\n')
  const codeLines = hasTrailingNewline ? lines.slice(0, -1) : lines
  const lineCount = codeLines.length

  const header = [
    `diff --git a/${filePath} b/${filePath}`,
    'new file mode 100644',
    'index 0000000..0000000',
    '--- /dev/null',
    `+++ b/${filePath}`,
    `@@ -0,0 +1,${lineCount} @@`
  ]
  const body = codeLines.map((line) => '+' + line)
  if (!hasTrailingNewline && codeLines.length > 0) {
    body.push('\\ No newline at end of file')
  }
  return [...header, ...body].join('\n')
}

export async function getStatus(repoPath: string) {
  const status = await getGit(repoPath).status()
  // Return a plain serializable object — StatusResult contains an isClean() method
  // which cannot be sent over Electron IPC (structured clone cannot serialize functions)
  return {
    not_added: status.not_added,
    conflicted: status.conflicted,
    created: status.created,
    deleted: status.deleted,
    modified: status.modified,
    renamed: status.renamed,
    staged: status.staged,
    files: status.files.map((f) => ({ path: f.path, index: f.index, working_dir: f.working_dir })),
    ahead: status.ahead,
    behind: status.behind,
    current: status.current,
    tracking: status.tracking,
    detached: status.detached,
    isClean: status.isClean()
  }
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

/**
 * Return a comprehensive diff that covers every kind of change:
 *   - staged modifications, deletions, and additions  (git diff --staged)
 *   - unstaged modifications and deletions             (git diff)
 *   - untracked (not-yet-added) files                  (synthetic diff)
 *
 * `git diff HEAD` combines staged + unstaged for tracked files.
 * Untracked files are never included by git diff, so we read them
 * from disk and produce a synthetic unified-diff block.
 */
export async function getFullDiff(repoPath: string): Promise<string> {
  const git = getGit(repoPath)
  const status = await git.status()

  // git diff HEAD = working-tree vs last commit (staged + unstaged combined)
  let trackedDiff = ''
  try {
    trackedDiff = await git.diff(['HEAD'])
  } catch {
    // HEAD may not exist yet (fresh repo, no commits) – fall back to staged diff
    try {
      trackedDiff = await git.diff(['--staged'])
    } catch {
      trackedDiff = ''
    }
  }

  // Build synthetic diffs for untracked files
  const untrackedFiles = status.not_added || []
  const parts: string[] = [trackedDiff]

  for (const filePath of untrackedFiles) {
    try {
      const content = await readFile(join(repoPath, filePath), 'utf-8')
      parts.push(generateNewFileDiff(filePath, content))
    } catch {
      // Skip files that can't be read (binary, permissions, etc.)
    }
  }

  return parts.filter(Boolean).join('\n')
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

export async function getBranches(repoPath: string) {
  const summary = await getGit(repoPath).branchLocal()
  return {
    detached: summary.detached,
    current: summary.current,
    all: summary.all,
    branches: Object.fromEntries(
      Object.entries(summary.branches).map(([k, v]) => [
        k,
        { current: v.current, name: v.name, commit: v.commit, label: v.label, linkedWorkTree: v.linkedWorkTree }
      ])
    )
  }
}

export async function checkout(repoPath: string, branch: string): Promise<void> {
  await getGit(repoPath).checkout(branch)
}

export async function createBranch(repoPath: string, branch: string): Promise<void> {
  await getGit(repoPath).checkoutLocalBranch(branch)
}

export async function getLog(repoPath: string, maxCount = 50) {
  const result = await getGit(repoPath).log({ maxCount })
  return {
    total: result.total,
    latest: result.latest ? { ...result.latest } : null,
    all: result.all.map((entry) => ({ ...entry }))
  }
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

export async function pull(repoPath: string): Promise<void> {
  const git = getGit(repoPath)
  await git.pull()
}

export async function push(repoPath: string): Promise<void> {
  const git = getGit(repoPath)
  try {
    await git.push()
  } catch (err: any) {
    // If no upstream branch, set it and push
    if (err?.message?.includes('no upstream')) {
      const branch = await getCurrentBranch(repoPath)
      if (branch && branch !== 'HEAD') {
        await git.push(['-u', 'origin', branch])
        return
      }
    }
    throw err
  }
}

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    return await getGit(repoPath).checkIsRepo()
  } catch {
    return false
  }
}
