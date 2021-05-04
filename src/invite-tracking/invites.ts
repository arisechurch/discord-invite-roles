import { Client, GuildMember } from "discord.js";
import * as F from "fp-ts/function";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Guilds from "../discord/guilds";
import * as DR from "../discord/rxjs";
import * as IT from "./invite-tracker";

const memberAdded = (tracker: IT.InviteTracker) => (member: GuildMember) => {
  const before = tracker.value[member.guild.id];

  return tracker.next(IT.updateGuild(member.guild)).then(() => {
    const after = tracker.value[member.guild.id];

    return Object.entries(after).reduce((invites, [code, invite]) => {
      if (before[code].uses === invite.uses) {
        return invites;
      }

      return [...invites, invite];
    }, [] as IT.TInviteSummary[]);
  });
};

export const stream$ = (client: Client) => {
  const inviteTracker = new IT.InviteTracker();
  const memberAddedAction = memberAdded(inviteTracker);
  inviteTracker.next(IT.init(client));

  Guilds.watch$(client).subscribe((guild) => {
    inviteTracker.next(IT.updateGuild(guild));
  });

  return DR.fromEvent(client)("guildMemberAdd").pipe(
    RxO.flatMap(([member]) => Rx.zip(Rx.of(member), memberAddedAction(member))),
    RxO.filter(([_, invites]) => invites.length === 1),
    RxO.map(([member, invites]) => F.tuple(member, invites[0])),
  );
};
