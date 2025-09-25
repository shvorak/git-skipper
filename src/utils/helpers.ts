export function extractIssueKey(branch: string): string | null {
  const regex = /\b([A-Z0-9]+-\d+)\b/i;

  const match = branch.match(regex);
  if (!match) return null;

  return match[1]?.toUpperCase() || null;
}
