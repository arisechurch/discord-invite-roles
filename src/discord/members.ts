import { GuildMember, Permissions } from "discord.js";

export const accessableChannels = (member: GuildMember) =>
  member.guild.channels.cache
    .array()
    .filter((channel) =>
      member
        .permissionsIn(channel)
        .has([
          Permissions.DEFAULT,
          Permissions.FLAGS.VIEW_CHANNEL,
          Permissions.FLAGS.SEND_MESSAGES,
        ]),
    );
