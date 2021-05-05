import { GuildMember } from "discord.js";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as Rx from "rxjs";
import * as RxO from "rxjs/operators";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";

export const addRolesFromInvite = () => (
  input$: Rx.Observable<[GuildMember, IT.TInviteSummary]>,
) =>
  input$.pipe(
    // Get the roles from the invite
    RxO.flatMap(([member, { channel }]) =>
      F.pipe(
        Channels.rolesFromTopic(
          member.guild.channels,
          member.guild.roles,
        )(channel),
        O.fold(
          () => Rx.EMPTY,
          (roles) => Rx.of(F.tuple(member, roles)),
        ),
      ),
    ),

    // Add the roles to the member
    RxO.flatMap(([member, roles]) =>
      member.roles.add(roles).then(() => F.tuple(member, roles)),
    ),
  );
