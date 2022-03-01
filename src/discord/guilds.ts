import { Client } from "droff";
import { ReadOnlyNonParentCacheStore } from "droff/dist/caches/stores";
import { Guild, InviteCreateEvent } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as TO from "fp-ts/TaskOption";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import { optionToObservable } from "../utils/option";

const guildFromInvite = (
  guildsCache: ReadOnlyNonParentCacheStore<Guild>,
  invite: Pick<InviteCreateEvent, "guild_id">,
) =>
  F.pipe(
    TO.fromNullable(invite.guild_id),
    TO.chain(TO.tryCatchK(guildsCache.get)),
    TO.chain(TO.fromNullable),
  );

export const watchInvites = (
  c: Client,
  guildsCache: ReadOnlyNonParentCacheStore<Guild>,
) =>
  Rx.merge(
    c.fromDispatch("GUILD_CREATE"),
    F.pipe(
      c.fromDispatch("INVITE_CREATE"),
      RxO.mergeMap((i) => guildFromInvite(guildsCache, i)()),
      RxO.mergeMap(optionToObservable),
    ),
    F.pipe(
      c.fromDispatch("INVITE_DELETE"),
      RxO.mergeMap((i) => guildFromInvite(guildsCache, i)()),
      RxO.mergeMap(optionToObservable),
    ),
  );
