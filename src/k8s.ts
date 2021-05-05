import * as F from "fp-ts/function";
import { sequenceT } from "fp-ts/lib/Apply";
import * as O from "fp-ts/Option";

export const shardIDFromEnv = () =>
  F.pipe(
    O.fromNullable(process.env.K8S_POD_NAME),
    O.chainNullableK((host) => /-(\d+)$/.exec(host)),
    O.map((matches) => +matches[1]),
  );

export const shardCount = () =>
  F.pipe(
    O.fromNullable(process.env.K8S_REPLICAS),
    O.map((count) => +count),
  );

export const shardConfig = () =>
  F.pipe(
    sequenceT(O.option)(shardIDFromEnv(), shardCount()),
    O.map(([id, count]) => ({
      id,
      count,
    })),
  );
