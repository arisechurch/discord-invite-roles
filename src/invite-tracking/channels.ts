import {
  GuildChannel,
  GuildChannelManager,
  Role,
  RoleManager,
  TextChannel,
} from "discord.js";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";

export const isText = (c: GuildChannel): c is TextChannel => c.isText();

export const rolesFromTopic = (
  channels: GuildChannelManager,
  roles: RoleManager,
) => (channelId: string) =>
  F.pipe(
    O.fromNullable(channels.cache.get(channelId)),
    O.filter(isText),
    O.chainNullableK((c) => c.topic),
    O.chainNullableK((topic) => /\[\[(.*)\]\]/.exec(topic)),
    O.map((matches) => matches[1].split(",").map((role) => role.trim())),
    O.map(
      (roleNames) =>
        roleNames
          .map((name) =>
            roles.cache.find(
              (r) => r.name.toLowerCase() === name.toLowerCase(),
            ),
          )
          .filter((r) => !!r) as Role[],
    ),
  );
