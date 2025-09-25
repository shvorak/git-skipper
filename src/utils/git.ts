import simpleGit from "simple-git";

export const git = simpleGit();

export async function getBranchPrefix() {
  const prefix = await git.getConfig("nebo.prefix");
  return prefix.value || "";
}

export async function getBranchDivergence(base: string, head = "HEAD") {
  const result = await git.raw([
    "rev-list",
    "--left-right",
    "--count",
    `${base}..${head}`,
  ]);

  const [behind, ahead] = result.trim().split(/\s+/);

  return {
    base,
    head,
    behind: Number(behind || 0),
    ahead: Number(ahead || 0),
  } as const;
}

export async function getInformation() {
  const remotes = await git.getRemotes();
  const remote = remotes[0]!.name;
  const target = (await git.getConfig("nebo.target")).value || "trunk";
  const branches = await git.branchLocal();
  const branch = branches.current;

  return {
    remote,
    target,
    branch,
  } as const;
}

export function validateBranchName(name: string) {
  if (!name || name.length === 0) {
    return "Name is required";
  }
  if (/\s/.test(name)) {
    return "Name cannot contain spaces";
  }
  if (!/^[A-Za-z0-9\-/_.]+$/.test(name)) {
    return "Name contains invalid characters";
  }
  return undefined;
}
