import { GatewayInviteCreateDispatchData } from "discord-api-types";
import { Client, Events } from "droff";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

const guildFromInvite = (c: Client) => (
  invite: Pick<GatewayInviteCreateDispatchData, "guild_id">,
) =>
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

export const watchInvites$ = (c: Client) =>
  Rx.merge(
    c.dispatch$(Events.GuildCreate),
    F.pipe(c.dispatch$(Events.InviteCreate), RxO.flatMap(guildFromInvite(c))),
    F.pipe(c.dispatch$(Events.InviteDelete), RxO.flatMap(guildFromInvite(c))),
  );
