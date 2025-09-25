#!/usr/bin/env node

import { isCancel, log, text } from "@clack/prompts";

import { program } from "commander";
import {
  getBranchPrefix,
  getInformation,
  git,
  validateBranchName,
} from "./utils/git";
import { footer, header, task } from "./utils/shell";

/**
 * 1. git fetch {remote}/{target}
 * 1.1 Check local changes
 * 2. Ask for branch name
 * 2.2 Check that this branch name is available
 * 3. git switch -c {branch} {remote}/{target}
 */

program
  .name("git start")
  .description("Automatest creation of branch")
  .argument("[branch]", "Branch name to create", (value) =>
    // Validator return error message or undefined when everything is OK
    validateBranchName(value) === undefined ? value : undefined,
  )
  .action(async (branchArg) => {
    // Empty line
    console.log();

    header("git start");

    await git.checkIsRepo();

    const prefix = await getBranchPrefix();
    const branch = await requireBranch(branchArg, prefix);

    if (isCancel(branch)) {
      process.exit(0);
    }

    const { remote, target } = await getInformation();

    await task({
      title: "Fetch upstream",
      handler: async ({ step, result }) => {
        step(`Fetch upstream ${remote}`);
        await git.fetch(remote, target);
        result("✔ done");
      },
    });

    await task({
      title: "Create branch",
      handler: async ({ step, result }) => {
        step(`Create branch ${branch}`);
        await git.checkoutBranch(branch, `${remote}/${target}`);
        result(`✔ ${branch} created`);
      },
    });

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

async function requireBranch(branchArg: unknown, prefix: string) {
  if (typeof branchArg === "string" && branchArg.length > 0) {
    return prefix + branchArg;
  }
  return await text({
    message: "Enter the name of new branch",
    placeholder: "Issue number",
    initialValue: prefix,
    validate: validateBranchName,
  });
}
