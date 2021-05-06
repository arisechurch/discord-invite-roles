import { Bloc } from "@bloc-js/bloc";
import * as F from "fp-ts/function";
import { Client, Guild } from "discord.js";
import { Map } from "immutable";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as DR from "../discord/rxjs";

export type TInviteSummary = {
  code: string;
  uses: number;
  channel: string;
};

export type TInviteMap = Map<string, TInviteSummary>;

export type State = Map<string, TInviteMap>;
export type Action = (
  b: InviteTracker,
  next: (s: State) => void,
) => Promise<void>;

export const init = (c: Client): Action => (b, next) =>
  DR.ready(c)
    .pipe(
      RxO.delay(1000),
      RxO.flatMap(() => c.guilds.cache.values()),
      RxO.tap((guild) => {
        console.log("[invite tracker]", "[init]", "adding guild", guild.name);
      }),
      RxO.flatMap((guild) => updateGuild(guild)(b, next)),
    )
    .toPromise();

export const updateGuild = (guild: Guild): Action => (b, next) => {
  return F.pipe(
    Rx.from(guild.fetchInvites()),
    RxO.flatMap((invites) => invites.values()),
    RxO.reduce(
      (acc, invite) =>
        acc.set(invite.code, {
          code: invite.code,
          uses: invite.uses || 0,
          channel: invite.channel.id,
        }),
      Map() as TInviteMap,
    ),
    (o) => Rx.lastValueFrom(o),
  ).then((invites) => next(b.value.set(guild.id, invites)));
};

export const removeGuild = (guild: Guild): Action => async (b, next) => {
  console.log("[Invite tracker]", "[removeGuild]", guild.name);
  return next(b.value.delete(guild.id));
};

export class InviteTracker extends Bloc<State> {
  constructor() {
    super(Map(), (a, b) => a === b);
  }
}
