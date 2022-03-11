import { Client } from "droff";
import { NonParentCacheStoreHelpers } from "droff/caches/stores";
import { Guild, InviteCreateEvent } from "droff/types";
import * as F from "fp-ts/function";
import * as TO from "fp-ts/TaskOption";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { optionToObservable } from "../utils/option";

const guildFromInvite = (
  client: Client,
  guildsCache: NonParentCacheStoreHelpers<Guild>,
  invite: Pick<InviteCreateEvent, "guild_id">,
) =>
  F.pipe(
    TO.fromNullable(invite.guild_id),
    TO.chain(TO.tryCatchK(guildsCache.getOr(client.getGuild))),
    TO.chain(TO.fromNullable),
  );

export const watchInvites = (
  c: Client,
  guildsCache: NonParentCacheStoreHelpers<Guild>,
) =>
  Rx.merge(
    c.fromDispatch("GUILD_CREATE"),
    F.pipe(
      c.fromDispatch("INVITE_CREATE"),
      RxO.mergeMap((i) => guildFromInvite(c, guildsCache, i)()),
      RxO.mergeMap(optionToObservable),
    ),
    F.pipe(
      c.fromDispatch("INVITE_DELETE"),
      RxO.mergeMap((i) => guildFromInvite(c, guildsCache, i)()),
      RxO.mergeMap(optionToObservable),
    ),
  );
