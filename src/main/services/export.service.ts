import type { Review, ReviewComment, Project } from './db.service'

export function generateMarkdown(
  project: Project,
  review: Review,
  comments: ReviewComment[]
): string {
  const now = new Date(review.submitted_at || review.created_at)
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const severityCounts = { bug: 0, suggestion: 0, nitpick: 0, question: 0 }
  for (const c of comments) {
    if (c.severity in severityCounts) {
      severityCounts[c.severity as keyof typeof severityCounts]++
    }
  }

  // Group comments by file
  const fileGroups: Record<string, ReviewComment[]> = {}
  for (const c of comments) {
    if (!fileGroups[c.file_path]) {
      fileGroups[c.file_path] = []
    }
    fileGroups[c.file_path].push(c)
  }

  let md = `# Code Review: ${project.name}\n\n`
  md += `**Branch**: ${review.branch} | **Date**: ${dateStr} | **Reviewer**: Self-Review\n\n`
  md += `## Summary\n\n`
  md += `- **Total Comments**: ${comments.length}\n`
  md += `- Bugs: ${severityCounts.bug} | Suggestions: ${severityCounts.suggestion} | Nitpicks: ${severityCounts.nitpick} | Questions: ${severityCounts.question}\n\n`
  md += `---\n\n`
  md += `## Files Reviewed\n\n`

  for (const [filePath, fileComments] of Object.entries(fileGroups)) {
    md += `### \`${filePath}\`\n\n`
    for (const c of fileComments) {
      const lineRange = c.start_line === c.end_line
        ? `Line ${c.start_line}`
        : `Lines ${c.start_line}-${c.end_line}`
      md += `**${lineRange}** | Severity: **${c.severity.charAt(0).toUpperCase() + c.severity.slice(1)}**\n\n`
      md += `${c.comment}\n\n`
      md += `---\n\n`
    }
  }

  return md
}
