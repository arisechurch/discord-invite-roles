require("dotenv").config();

import { Client } from "discord.js";
import * as IR from "./invite-tracking/invite-roles";
import * as I from "./invite-tracking/invites";

async function main() {
  const client = new Client();

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
