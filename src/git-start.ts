#!/usr/bin/env bun

import { isCancel, log, select, text } from "@clack/prompts";

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
    header("git start");

    await git.checkIsRepo();

    const prefix = await getBranchPrefix();
    const requestedBranch = await requireBranch(branchArg, prefix);

    if (isCancel(requestedBranch)) {
      process.exit(0);
    }

    let branch: string = requestedBranch;

    const { remote, target } = await getInformation();

    await task({
      title: "Fetch upstream",
      handler: async ({ step, result }) => {
        step(`Fetch upstream ${remote}`);
        await git.fetch(remote, target);
        result("✔ done");
      },
    });

    const existingBranch = await findExistingBranch(branch, remote);

    if (existingBranch) {
      const action = await select({
        message: `Branch ${branch} already exists`,
        options: [
          { value: "switch", label: "Switch to existing branch" },
          { value: "suffix", label: "Create a new branch with a suffix" },
        ],
      });

      if (isCancel(action)) {
        process.exit(0);
      }

      if (action === "switch") {
        await task({
          title: "Switch branch",
          handler: async ({ step, result }) => {
            step(`Switch to branch ${branch}`);

            if (existingBranch === "local") {
              await git.checkout(branch);
            } else {
              await git.checkoutBranch(branch, `${remote}/${branch}`);
            }

            result(`✔ switched to ${branch}`);
          },
        });

        footer();
        return;
      }

      branch = await requireAvailableBranchWithSuffix(branch, remote);
    }

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

async function findExistingBranch(branch: string, remote: string) {
  const localBranches = await git.branchLocal();
  if (localBranches.all.includes(branch)) {
    return "local" as const;
  }

  const remoteBranches = await git.branch([
    "--remotes",
    "--list",
    `${remote}/${branch}`,
  ]);
  if (remoteBranches.all.includes(`${remote}/${branch}`)) {
    return "remote" as const;
  }

  return undefined;
}

async function requireAvailableBranchWithSuffix(
  branch: string,
  remote: string,
) {
  while (true) {
    const suffix = await text({
      message: "Enter branch suffix",
      placeholder: "2",
      validate: (value) => {
        if (!value) {
          return "Suffix is required";
        }

        return validateBranchName(`${branch}-${value}`);
      },
    });

    if (isCancel(suffix)) {
      process.exit(0);
    }

    const newBranch = `${branch}-${suffix}`;
    if (!(await findExistingBranch(newBranch, remote))) {
      return newBranch;
    }

    log.warn(`Branch ${newBranch} already exists`);
  }
}
