import * as Topgg from "@top-gg/sdk";
import {
  NonParentCacheStore,
  NonParentCacheStoreHelpers,
} from "droff/caches/stores";
import { Guild } from "droff/types";
import * as RxO from "rxjs/operators";

// Post server count to top.gg every 60s or on change
export const updateStats = (
  api: Topgg.Api,
  guildsCache: NonParentCacheStore<Guild> & NonParentCacheStoreHelpers<Guild>,
) =>
  guildsCache.watch$.pipe(
    RxO.flatMap(() => guildsCache.size()),
    RxO.distinctUntilChanged(),
    RxO.auditTime(60000),
    RxO.tap((serverCount) =>
      console.log("[main.ts]", "Updating top.gg server count:", serverCount),
    ),
    RxO.flatMap((serverCount) =>
      api.postStats({
        serverCount,
      }),
    ),
  );
