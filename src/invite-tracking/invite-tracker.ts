import { Bloc, BlocAction } from "@bloc-js/bloc";
import { Client, Guild } from "discord.js";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as DR from "../discord/rxjs";

export type TInviteSummary = {
  code: string;
  uses: number;
  channel: string;
};

type TInviteMap = {
  [inviteCode: string]: TInviteSummary;
};

export type State = {
  [guildId: string]: TInviteMap;
};

export type Action = BlocAction<State>;

export const init = (c: Client): Action => (b, next) =>
  DR.ready(c)
    .pipe(
      RxO.delay(1000),
      RxO.flatMap(() => c.guilds.cache.values()),
      RxO.flatMap((guild) => updateGuild(guild)(b, next) as Promise<void>),
    )
    .toPromise() as Promise<void>;

export const updateGuild = (guild: Guild): Action => (b, next) =>
  Rx.from(guild.fetchInvites())
    .pipe(
      RxO.flatMap((coll) => coll.values()),
      RxO.reduce(
        (acc, invite) => ({
          ...acc,
          [invite.code]: {
            code: invite.code,
            uses: invite.uses || 0,
            channel: invite.channel.id,
          },
        }),
        {} as TInviteMap,
      ),
      RxO.tap((invites) => {
        next({
          ...b.value,
          [guild.id]: invites,
        });
      }),
    )
    .toPromise() as Promise<void>;

export class InviteTracker extends Bloc<State> {
  constructor() {
    super({});
  }
}
