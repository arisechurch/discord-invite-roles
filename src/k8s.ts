import * as F from "fp-ts/function";
import { sequenceT } from "fp-ts/lib/Apply";
import * as O from "fp-ts/Option";

export const podIndex = () =>
  F.pipe(
    O.fromNullable(process.env.K8S_POD_NAME),
    O.chainNullableK((host) => /-(\d+)$/.exec(host)),
    O.map((matches) => +matches[1]),
  );

export const replicas = () =>
  F.pipe(
    O.fromNullable(process.env.K8S_REPLICAS),
    O.map((count) => +count),
  );

export const shardsPerPod = () =>
  F.pipe(
    O.fromNullable(process.env.K8S_SHARDS_PER_POD),
    O.map((count) => +count),
    O.getOrElse(() => 1),
  );

export const shardConfig = () =>
  F.pipe(
    sequenceT(O.option)(podIndex(), replicas()),
    O.map(([index, replicas]) => {
      const perPod = shardsPerPod();
      const startIndex = index * perPod;
      const shardCount = replicas * perPod;

      return {
        shardIDs: [...Array(perPod).keys()].map((n) => startIndex + n),
        shardCount,
      };
    }),
  );
