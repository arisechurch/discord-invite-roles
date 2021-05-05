import { Client } from "discord.js";
import * as DR from "./rxjs";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";

export const watchInvites$ = (c: Client) =>
  Rx.merge(
    DR.fromEvent(c)("guildCreate").pipe(RxO.map(([guild]) => guild)),
    DR.fromEvent(c)("inviteCreate").pipe(
      RxO.flatMap(([invite]) =>
        invite.guild ? Rx.of(invite.guild) : Rx.EMPTY,
      ),
    ),
    DR.fromEvent(c)("inviteDelete").pipe(
      RxO.flatMap(([invite]) =>
        invite.guild ? Rx.of(invite.guild) : Rx.EMPTY,
      ),
    ),
  );
