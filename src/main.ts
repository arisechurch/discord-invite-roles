require("dotenv").config();

import { Api as TopggClient } from "@top-gg/sdk";
import { createClient, Intents } from "droff";
import { Guild, GuildMemberAddEvent, Role } from "droff/dist/types";
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as IR from "./invite-tracking/invite-roles";
import * as Invites from "./invite-tracking/invites";
import * as Topgg from "./topgg";

async function main() {
  const client = createClient({
    token: process.env.DISCORD_BOT_TOKEN!,
    gateway: {
      intents: Intents.GUILDS | Intents.GUILD_MEMBERS | Intents.GUILD_INVITES,
      shardIDs: "auto",
    },
  });
  const topgg = new TopggClient(process.env.TOPGG_TOKEN!);

  // Debug on SIGUSR2
  Rx.fromEvent(process, "SIGUSR2")
    .pipe(RxO.first())
    .subscribe(() => {
      client.gateway.raw$.subscribe(console.log);
    });

  const [invites$, inviteEffects$] = Invites.used(client);
  const invitesToRoles$ = invites$.pipe(
    client.withCaches({})(([member]) => member.guild_id),
    client.onlyWithGuild(),

    RxO.flatMap(async ([[member, invite], { guild }]) => {
      const result = await IR.addRolesFromInvite(client)(guild)(
        member,
        invite,
      )();
      return [result, guild] as const;
    }),

    RxO.tap(([result, guild]) =>
      F.pipe(
        result,
        E.fold(
          (err) => console.log("[main]", "Error in `addRolesFromInvite`:", err),
          (results) => results.forEach(logResult(guild)),
        ),
      ),
    ),
  );

  Rx.merge(
    // Client
    client.effects$,

    // Top.gg
    Topgg.updateStats(topgg, client.guilds$),

    // Invites to roles
    inviteEffects$,
    invitesToRoles$,
  ).subscribe();
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
