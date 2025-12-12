// export function $()

import { intro, isCancel, outro, spinner } from "@clack/prompts";
import color from "picocolors";

export type TaskInit<T> = {
  title: string;
  handler: (control: TaskControl) => Promise<T>;
  enabled?: boolean;
};

export type TaskControl = {
  step: (message: string) => void;
  result: (message: string) => void;
};

export async function task<T = void>({
  title,
  handler,
}: TaskInit<T>): Promise<T> {
  let hint: string | undefined;

  const loader = spinner();

  const messages: TaskControl = {
    step: loader.message,
    result: (text) => {
      hint = text;
    },
  };

  loader.start(title);
  const result = await handler(messages).catch((error) => {
    loader.stop(`${title}: ${error.message}`, 1);
    process.exit(1);
  });

  if (hint) {
    loader.stop(`${title}: ${color.dim(hint)}`);
  } else {
    loader.stop(title);
  }
  return result;
}

export function exitOnCancel(value: string | symbol): string {
  if (isCancel(value)) {
    process.exit(0);
  } else {
    return value;
  }
}

export function header(title: string) {
  // Empty line
  console.log();
  intro(color.bgMagenta(color.black(` ${title} `)));
}

export function footer(
  message = "Problems? https://github.com/shvorak/git-skipper/issues",
) {
  outro(message);
}
