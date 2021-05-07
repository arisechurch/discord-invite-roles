import { GatewayGuildMemberAddDispatchData, Routes } from "discord-api-types";
import { Client } from "droff";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";
import * as Members from "../discord/members";

export const addRolesFromInvite = (c: Client) => (
  input$: Rx.Observable<[GatewayGuildMemberAddDispatchData, IT.TInviteSummary]>,
) =>
  input$.pipe(
    RxO.flatMap(([member, invite]) =>
      F.pipe(
        Members.guild(c)(member),
        O.fold(
          () => Rx.EMPTY,
          (guild) => Rx.of(F.tuple(member, invite, guild)),
        ),
      ),
    ),

    // Get the roles from the invite
    RxO.flatMap(([member, { channel }, guild]) =>
      F.pipe(
        Channels.rolesFromTopic(guild.channels!, guild.roles)(channel),
        O.fold(
          () => Rx.EMPTY,
          (roles) => Rx.zip(Rx.of(member), roles),
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
