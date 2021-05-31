import { Bloc } from "@bloc-js/bloc";
import { Client } from "droff";
import { Invite, InviteMetadatum, Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import { Map } from "immutable";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

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

export const updateGuild =
  (c: Client) =>
  (guildID: Snowflake): Action =>
  (b, next) =>
    F.pipe(
      Rx.from(
        c.getGuildInvites(guildID) as Promise<(Invite & InviteMetadatum)[]>,
      ),
      RxO.catchError(() => []),
      RxO.flatMap((invites) => invites),
      RxO.reduce(
        (acc, invite) =>
          acc.set(invite.code, {
            code: invite.code,
            uses: invite.uses,
            channel: invite.channel.id,
          }),
        Map() as TInviteMap,
      ),
      (o) => Rx.lastValueFrom(o),
    ).then((invites) => next(b.value.set(guildID, invites)));

export const removeGuild =
  (guildID: Snowflake): Action =>
  async (b, next) => {
    console.log("[Invite tracker]", "[removeGuild]", guildID);
    return next(b.value.delete(guildID));
  };

export class InviteTracker extends Bloc<State> {
  constructor() {
    super(Map(), (a, b) => a === b);
  }
}
