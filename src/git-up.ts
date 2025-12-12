#!/usr/bin/env bun

import { log, text } from "@clack/prompts";
import { program } from "commander";

import { getInformation, git } from "./utils/git";
import { extractIssueKey } from "./utils/helpers";
import { exitOnCancel, footer, header, task } from "./utils/shell";

const PREFIX = "NOTICKET";

type Arguments = {
  amend?: boolean;
};

program
  .name("git up")
  .description(
    "Automatest operations with rebasing, pushing and making merge requests",
  )
  .option("--ready", "Publish merge request")
  .option("--merge", "Setting auto merge for merge request")
  .option("--amend", "Amend tracked changes and put them to last commit")
  .action(async (args: Arguments) => {
    header("git up");

    await git.checkIsRepo();

    const info = await getInformation();

    const status = await task({
      title: "Check status",
      handler: async ({ step, result }) => {
        step("Checking status");
        const status = await git.status();

        step("Adding changes");
        // TODO: Get project root dir and use it instead of current dir
        await git.add("./*");

        if (status.files.length === 0) {
          result("Nothing to commit");
        }

        return status;
      },
    });

    let message = "git up";

    const changed = status.files.length > 0;

    if (changed) {
      // This is naive check for a new branch
      const requireMessage =
        status.tracking !== `${info.remote}/${info.branch}`;

      if (requireMessage) {
        const prefix = extractIssueKey(info.branch) || PREFIX;
        message = await text({
          message: "Enter commit message",
          initialValue: `${prefix}. `,
        }).then(exitOnCancel);
      }

      await task({
        title: "Commit changes",
        handler: async ({ step }) => {
          const options = [args.amend && "--amend"].filter(
            (v) => typeof v === "string",
          );

          step("Adding changes");
          await git.add("./*");
          step("Commit changes");
          await git.commit(message, options);
        },
      });
    }

    await task({
      title: "Rebase branch",
      handler: async ({ step }) => {
        step(`Fetching remote: ${info.remote}`);
        await git.fetch(info.remote, info.target);
        step("Rebasing");
        // TODO: Handle conflicts
        await git.pull(info.remote, info.target, ["--rebase"]);
      },
    });

    const mergeRequestUrl = await task({
      title: "Push changes",
      handler: async ({ result }) => {
        const push = await git.push(info.remote, info.branch, [
          "--force-with-lease",
          "-o merge_request.create",
          "-o merge_request.draft",
        ]);

        if (push.pushed.some((push) => push.alreadyUpdated)) {
          result("Already up to date");
        }

        // Simple way to find merge request url
        return push.remoteMessages.all.find((value) =>
          value.startsWith("https://"),
        );
      },
    });

    if (mergeRequestUrl) {
      log.info(`MR: ${mergeRequestUrl}`);
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
