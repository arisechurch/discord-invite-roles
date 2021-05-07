require("dotenv").config();

import { createClient, Intents } from "droff";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as IR from "./invite-tracking/invite-roles";
import * as Invites from "./invite-tracking/invites";
import * as K8s from "./k8s";

async function main() {
  const shardConfig = F.pipe(
    K8s.shardConfig(),
    O.getOrElse(() => ({})),
  );

  console.log("[main]", "Using shard config:", shardConfig);

  const client = createClient({
    ...shardConfig,
    token: process.env.DISCORD_BOT_TOKEN!,
    intents: Intents.GUILDS | Intents.GUILD_MEMBERS | Intents.GUILD_INVITES,
  });

  Invites.used$(client)
    .pipe(IR.addRolesFromInvite(client))
    .subscribe(([member, role]) => {
      const guild = client.guilds$.value.get(member.guild_id)!;
      console.log(
        "[main]",
        `${guild.name} (${guild.id})`,
        `${member.user!.username} added to role ${role.name}`,
      );
    });
}

main();
