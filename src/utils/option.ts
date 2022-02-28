import { pipe } from "fp-ts/lib/function";
import { fold, Option } from "fp-ts/lib/Option";
import { EMPTY, Observable, of } from "rxjs";

export const optionToObservable = <T>(a: Option<T>): Observable<T> =>
  pipe(
    a,
    fold(() => EMPTY, of),
  );
