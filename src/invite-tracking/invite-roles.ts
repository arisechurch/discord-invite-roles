import { Client } from "droff";
import { Guild, GuildMemberAddEvent, Role } from "droff/types";
import * as F from "fp-ts/function";
import { sequenceT } from "fp-ts/lib/Apply";
import * as TE from "fp-ts/TaskEither";
import * as Channels from "./channels";
import * as IT from "./invite-tracker";

const guildSummary = (guild: Guild) => `${guild.name} (${guild.id})`;

export const addRolesFromInvite =
  (c: Client) =>
  (guild: Guild) =>
  (member: GuildMemberAddEvent, invite: IT.TInviteSummary) =>
    F.pipe(
      sequenceT(TE.ApplyPar)(
        TE.tryCatch(
          () => c.getGuildRoles(guild.id),
          () => `Could not get roles for guild ${guildSummary(guild)}`,
        ),
        TE.tryCatch(
          () => c.getGuildChannels(member.guild_id),
          () => `Could not get roles for guild ${guildSummary(guild)}`,
        ),
      ),

      TE.chain(
        F.flow(
          ([roles, channels]) =>
            Channels.rolesFromTopic(channels, roles)(invite.channel),
          TE.fromOption(
            () =>
              `Could not extract roles from channel topic (${guildSummary(
                guild,
              )})`,
          ),
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
