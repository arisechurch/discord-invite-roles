import { Snowflake } from "discord-api-types";
import { Client } from "droff";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";

export const guild = (c: Client) => (member: { guild_id?: Snowflake }) =>
  F.pipe(
    O.fromNullable(member.guild_id),
    O.chainNullableK((id) => c.guilds$.value.get(id)),
  );
