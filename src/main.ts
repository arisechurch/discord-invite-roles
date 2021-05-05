require("dotenv").config();

import { Client } from "discord.js";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as IR from "./invite-tracking/invite-roles";
import * as I from "./invite-tracking/invites";
import { shardConfig } from "./k8s";

async function main() {
  const client = new Client(
    F.pipe(
      shardConfig(),
      O.map(({ id, count }) => ({
        shards: id,
        shardCount: count,
      })),
      O.toUndefined,
    ),
  );

  client.on("debug", console.log);

  I.stream$(client)
    .pipe(IR.addRolesFromInvite())
    .subscribe(([member, roles]) => {
      console.log(
        `${member.displayName} added to roles ${roles
          .map((r) => r.name)
          .join(", ")}`,
      );
    });

  client.login(process.env.DISCORD_BOT_TOKEN);
}

main();
