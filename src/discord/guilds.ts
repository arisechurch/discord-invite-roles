import { Client } from "droff";
import { InviteCreateEvent } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

const guildFromInvite =
  (c: Client) => (invite: Pick<InviteCreateEvent, "guild_id">) =>
    c.guilds$.pipe(
      RxO.take(1),
      RxO.flatMap((guilds) =>
        F.pipe(
          O.fromNullable(invite.guild_id),
          O.chainNullableK((id) => guilds.get(id)),
          O.fold(
            () => Rx.EMPTY,
            (guild) => Rx.of(guild),
          ),
        ),
      ),
    );

export const watchInvites = (c: Client) =>
  Rx.merge(
    c.fromDispatch("GUILD_CREATE"),
    F.pipe(c.fromDispatch("INVITE_CREATE"), RxO.flatMap(guildFromInvite(c))),
    F.pipe(c.fromDispatch("INVITE_DELETE"), RxO.flatMap(guildFromInvite(c))),
  );
