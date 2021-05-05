import { Bloc } from "@bloc-js/bloc";
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
      RxO.flatMap((guild) => updateGuild(guild)(b, next)),
    )
    .toPromise();

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
        next(b.value.set(guild.id, invites));
      }),
    )
    .toPromise() as Promise<void>;

export const removeGuild = (guildId: string): Action => async (b, next) =>
  next(b.value.delete(guildId));

export class InviteTracker extends Bloc<State> {
  constructor() {
    super(Map());
  }
}
