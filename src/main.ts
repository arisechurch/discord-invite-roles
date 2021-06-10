require("dotenv").config();

import { Api as TopggClient } from "@top-gg/sdk";
import { createClient, Intents } from "droff";
import { Guild, GuildMemberAddEvent, Role } from "droff/dist/types";
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as IR from "./invite-tracking/invite-roles";
import * as Invites from "./invite-tracking/invites";
import * as K8s from "./k8s";
import * as Topgg from "./topgg";

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
  const topgg = new TopggClient(process.env.TOPGG_TOKEN!);

  Topgg.updateStats(topgg, client.guilds$).subscribe();

  // Debug on SIGUSR2
  Rx.fromEvent(process, "SIGUSR2")
    .pipe(RxO.first())
    .subscribe(() => {
      client.gateway.raw$.subscribe(console.log);
    });

  // Post server count to top.gg every 60s or on change
  client.guilds$
    .pipe(
      RxO.map((guilds) => guilds.count()),
      RxO.distinctUntilChanged(),
      RxO.auditTime(60000),
      RxO.tap((serverCount) =>
        console.log("[main.ts]", "Updating top.gg server count:", serverCount),
      ),
      RxO.flatMap((serverCount) =>
        topgg.postStats({
          serverCount,
        }),
      ),
    )
    .subscribe();

  Invites.used$(client)
    .pipe(
      client.withCaches({})(([member]) => member.guild_id),
      client.onlyWithGuild(),

      RxO.flatMap(async ([[member, invite], { guild }]) => {
        const result = await IR.addRolesFromInvite(client)(guild)(
          member,
          invite,
        )();
        return [result, guild] as const;
      }),
    )
    .subscribe(([result, guild]) =>
      F.pipe(
        result,
        E.fold(
          (err) => console.log("[main]", "Error in `addRolesFromInvite`:", err),
          (results) => results.forEach(logResult(guild)),
        ),
      ),
    );
}

const logResult =
  (guild: Guild) =>
  ([member, role]: readonly [GuildMemberAddEvent, Role]) => {
    console.log(
      "[main]",
      `${guild.name} (${guild.id})`,
      `${member.user!.username} added to role ${role.name}`,
    );
  };

main();
