import { $ } from "bun";

const exists = Boolean(await $`which glab`.quiet().text());

async function mrView(branch: string) {
  if (exists === false) return;
  return $`glab mr view ${branch}`.quiet().text();
}

export const glab = {
  mr: {
    view: mrView,
  },
} as const;
