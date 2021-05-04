import { Client, ClientEvents } from "discord.js";
import { memoize } from "fp-ts-std/Function";
import * as Eq from "fp-ts/Eq";
import * as Rx from "rxjs";

function listen$<K extends keyof ClientEvents>(c: Client, event: K) {
  console.log("listening to", event);
  return Rx.fromEvent(c, event, (...args) => args as ClientEvents[K]);
}

const listenMemo$ = memoize(
  Eq.tuple(
    Eq.eqStrict as Eq.Eq<Client>,
    Eq.eqString as Eq.Eq<keyof ClientEvents>,
  ),
)(([client, event]) => listen$(client, event));

export type TFromEvent = <K extends keyof ClientEvents>(
  event: K,
) => Rx.Observable<ClientEvents[K]>;

export const fromEvent = (client: Client): TFromEvent => (event) =>
  listenMemo$([client, event]) as any;

export const ready = memoize<Client>(Eq.eqStrict)(
  (c) =>
    new Rx.Observable<void>((s) => {
      c.once("ready", () => {
        s.next();
        s.complete();
      });
    }),
);
