import { Client } from "droff";
import { GuildMemberAddEvent } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";

export const addRolesFromInvite =
  (c: Client) =>
  (input$: Rx.Observable<[GuildMemberAddEvent, IT.TInviteSummary]>) =>
    input$.pipe(
      RxO.flatMap(([member, invite]) =>
        Rx.zip(
          Rx.of(member),
          Rx.of(invite),
          c.getGuildRoles(member.guild_id),
          c.getGuildChannels(member.guild_id),
        ),
      ),

      // Get the roles from the invite
      RxO.flatMap(([member, { channel }, roles, channels]) =>
        F.pipe(
          Channels.rolesFromTopic(channels, roles)(channel),
          O.fold(
            () => Rx.EMPTY,
            (roles) => Rx.combineLatest([Rx.of(member), roles]),
          ),
        ),
      ),

      // Add the roles to the member
      RxO.flatMap(([member, role]) =>
        c
          .addGuildMemberRole(member.guild_id, member.user!.id, role.id)
          .then(() => F.tuple(member, role)),
      ),
    );
