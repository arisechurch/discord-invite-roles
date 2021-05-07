import { APIChannel, APIRole } from "discord-api-types";
import * as Arr from "fp-ts/Array";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";

export const rolesFromTopic = (channels: APIChannel[], roles: APIRole[]) => (
  channelId: string,
) =>
  F.pipe(
    channels,
    Arr.findFirst((c) => c.id === channelId),
    O.chainNullableK((c) => c.topic),
    O.chainNullableK((topic) => /\[\[(.*)\]\]/.exec(topic)),
    O.map((matches) => matches[1].split(",").map((role) => role.trim())),
    O.map(
      (roleNames) =>
        roleNames
          .map((name) =>
            roles.find((r) => r.name.toLowerCase() === name.toLowerCase()),
          )
          .filter((r) => !!r) as APIRole[],
    ),
  );
