import { Channel, Role } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";

export const rolesFromTopic =
  (channels: Channel[], roles: Role[]) => (channelId: string) =>
    F.pipe(
      O.fromNullable(channels.find((c) => c.id === channelId)),
      O.chainNullableK((c) => c.topic),
      O.chainNullableK((topic) => /\[\[(.*)\]\]/.exec(topic)),
      O.map((matches) => matches[1].split(",").map((role) => role.trim())),
      O.map(
        (roleNames) =>
          roleNames
            .map((name) =>
              roles.find((r) => r.name.toLowerCase() === name.toLowerCase()),
            )
            .filter((r) => !!r) as Role[],
      ),
    );
