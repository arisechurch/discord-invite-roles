import * as Topgg from "@top-gg/sdk";
import { SnowflakeMap } from "droff/dist/caches/resources";
import { Guild } from "droff/dist/types";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

// Post server count to top.gg every 60s or on change
export const updateStats = (
  api: Topgg.Api,
  guilds$: Rx.Observable<SnowflakeMap<Guild>>,
) =>
  guilds$.pipe(
    RxO.map((guilds) => guilds.count()),
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
