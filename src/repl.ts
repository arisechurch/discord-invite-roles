import * as Net from "net";
import * as Repl from "repl";

export const create = (ctx: any) =>
  Net.createServer((s) => {
    const remote = Repl.start({
      prompt: "node::remote> ",
      input: s,
      output: s,
    });

    Object.assign(remote.context, ctx);

    remote.once("exit", () => {
      s.end();
    });
  });
