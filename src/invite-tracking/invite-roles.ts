import { GatewayGuildMemberAddDispatchData } from "discord-api-types";
import { Client } from "droff";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";

export const addRolesFromInvite =
  (c: Client) =>
  (
    input$: Rx.Observable<
      [GatewayGuildMemberAddDispatchData, IT.TInviteSummary]
    >,
  ) =>
    input$.pipe(
      c.withLatest(([member]) => member.guild_id),

      // Get the roles from the invite
      RxO.flatMap(([[member, { channel }], guildCtx]) =>
        F.pipe(
          Channels.rolesFromTopic(guildCtx!.channels, guildCtx!.roles)(channel),
          O.fold(
            () => Rx.EMPTY,
            (roles) => Rx.combineLatest(Rx.of(member), roles),
          ),
        ),
      ),

      // Add the roles to the member
      RxO.flatMap(([member, role]) =>
        c
          .putGuildMemberRole([member.guild_id, member.user!.id, role.id])
          .then(() => F.tuple(member, role)),
      ),
    );
