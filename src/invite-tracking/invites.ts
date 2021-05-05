import { Client, GuildMember } from "discord.js";
import * as F from "fp-ts/function";
import { sequenceT } from "fp-ts/lib/Apply";
import * as O from "fp-ts/Option";
import { List } from "immutable";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Guilds from "../discord/guilds";
import * as DR from "../discord/rxjs";
import * as IT from "./invite-tracker";

const usedInvites = (before: IT.TInviteMap, after: IT.TInviteMap) => {
  return after.reduce((invites, invite, code) => {
    const beforeUses = before.get(code)?.uses || 0;
    const afterUses = after.get(code)?.uses || 0;
    return beforeUses < afterUses ? invites.push(invite) : invites;
  }, List<IT.TInviteSummary>());
};

const memberUsedInvite = (tracker: IT.InviteTracker) => (
  member: GuildMember,
): Promise<List<IT.TInviteSummary>> => {
  const before = O.fromNullable(tracker.value.get(member.guild.id));

  return tracker.next(IT.updateGuild(member.guild)).then(() => {
    const after = O.fromNullable(tracker.value.get(member.guild.id));

    return F.pipe(
      sequenceT(O.option)(before, after),
      O.map(([before, after]) => usedInvites(before, after)),
      O.getOrElse(() => List()),
    );
  });
};

export const used$ = (client: Client) => {
  const inviteTracker = new IT.InviteTracker();
  inviteTracker.next(IT.init(client));

  Guilds.watchInvites$(client).subscribe((guild) => {
    inviteTracker.next(IT.updateGuild(guild));
  });

  return DR.fromEvent(client)("guildMemberAdd").pipe(
    RxO.flatMap(([member]) =>
      Rx.zip(Rx.of(member), memberUsedInvite(inviteTracker)(member)),
    ),
    RxO.filter(([_, invites]) => invites.count() === 1),
    RxO.map(([member, invites]) => F.tuple(member, invites.get(0)!)),
  );
};
