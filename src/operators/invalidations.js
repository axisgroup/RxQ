import { switchMap, startWith } from "rxjs/operators";

const invalidations = (startWithInvalidation = false) => handle$ =>
  handle$.pipe(
    switchMap(
      handle =>
        startWithInvalidation
          ? startWith(handle)(handle.invalidated$)
          : handle.invalidated$
    )
  );

export default invalidations;
