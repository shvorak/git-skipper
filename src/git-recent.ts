#!/usr/bin/env node

import { log, select } from "@clack/prompts";
import { program } from "commander";
import { GitError } from "simple-git";
import { getInformation, git } from "./utils/git";
import { exitOnCancel, footer, header, task } from "./utils/shell";

const MIN = 5;
const MAX = 30;

program
  .name("git recent")
  .option(
    "-c, --count [value]",
    "Amount of recent branches to show",
    (value) => Math.min(MAX, Math.max(Number(value), MIN)),
    10,
  )
  .action(async ({ count = 10 }) => {
    // Empty line
    console.log();

    header("git recent");

    await git.checkIsRepo();
    const info = await getInformation();

    const recent = await getRecentBranches(count);
    const options = recent
      .filter((i) => i.name !== info.branch)
      .map((i) => ({ value: i.name, label: i.name, hint: i.rel }) as const);

    if (options.length > 0) {
      const choice = await select({
        message: "Select branch",
        options: options,
      }).then(exitOnCancel);

      await task({
        title: "Switch branch",
        handler: async ({ result }) => {
          await git.raw("switch", choice);
          result("✔ done");
        },
      });

      log.success(`Switched to ${choice}`);
    } else {
      log.info("No recent branches found");
    }

    footer();
  });

try {
  await program.parseAsync();
} catch (error) {
  if (error instanceof Error) {
    log.error(error.message);
  } else {
    log.error("Failed to run command");
  }
}

// private

async function getRecentBranches(limit = 10) {
  const out = await git.raw([
    "for-each-ref",
    "--sort=-committerdate",
    `--count=${limit}`,
    "refs/heads/",
    `--format=%(refname:short)|%(committerdate:relative)`,
  ]);
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, rel] = line.split("|") as [string, string];
      return { name, rel } as const;
    });
}
