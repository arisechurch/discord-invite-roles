import { Guild, Snowflake } from "droff/dist/types";
import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Map } from "immutable";

export const guild =
  (guilds: Map<Snowflake, Guild>) => (member: { guild_id?: Snowflake }) =>
    F.pipe(
      O.fromNullable(member.guild_id),
      O.chainNullableK((id) => guilds.get(id)),
    );
