import { Client } from "droff";
import { GuildMemberAddEvent, Role } from "droff/dist/types";
import * as F from "fp-ts/function";
import { sequenceT } from "fp-ts/lib/Apply";
import * as TE from "fp-ts/TaskEither";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";

export const addRolesFromInvite =
  (c: Client) => (member: GuildMemberAddEvent, invite: IT.TInviteSummary) =>
    F.pipe(
      sequenceT(TE.ApplyPar)(
        TE.tryCatch(
          () => c.getGuildRoles(member.guild_id),
          () => `Could not get roles for guild (${member.guild_id})`,
        ),
        TE.tryCatch(
          () => c.getGuildChannels(member.guild_id),
          () => `Could not get roles for guild (${member.guild_id})`,
        ),
      ),

      TE.chain(
        F.flow(
          ([roles, channels]) =>
            Channels.rolesFromTopic(channels, roles)(invite.channel),
          TE.fromOption(() => "Could not extract roles from channel topic"),
        ),
      ),

      TE.chain(addRoles(c)(member)),
    );

const addRoles =
  (c: Client) => (member: GuildMemberAddEvent) => (roles: Role[]) =>
    TE.tryCatch(
      () =>
        Promise.all(
          roles.map((role) =>
            c
              .addGuildMemberRole(member.guild_id, member.user!.id, role.id)
              .then(() => [member, role] as const),
          ),
        ),
      (err) => `Could not add roles to member: ${err}`,
    );
