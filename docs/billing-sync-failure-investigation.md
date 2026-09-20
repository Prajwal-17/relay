# Billing sync failure investigation

## Scope

This report characterizes the production symptom where an estimate showed a sync failure, blocked
print/close, and contained only the earlier items after refresh. It adds regression coverage only;
no production behavior is changed.

Investigation base: `origin/master` at `d875479` on branch
`test/billing-sync-regression`.

## Finding

The number of items is not the failure boundary. Normal creates with 10, 12, and 15 rows all
complete, and the request schema allows as many as 500 rows.

The exact symptom is reproducible when the initial estimate create has an **ambiguous outcome**:

1. The 800 ms debounce sends the currently valid rows, for example rows 1–12, to
   `POST /api/estimates/create`.
2. SQLite commits the estimate and those 12 rows atomically.
3. The renderer does not receive a usable acknowledgement. This can happen when the request is
   aborted at 15 seconds, the local API connection breaks, or the response is malformed/lost after
   commit.
4. Because no acknowledgement arrived, the renderer still has no confirmed `billingId` or saved
   item IDs. It marks the rows dirty and displays the error state.
5. The user adds rows 13–15. A flush from Print & Close or Close Tab retries the create with the
   same stable billing identity, but now with 15 rows.
6. The server finds the already committed 12-row estimate, sees that the replay contains a
   different number of rows, and returns HTTP 409:
   `Estimate replay does not match the original request`.
7. The flush rejects. Print and close intentionally stop because they cannot prove that the UI and
   database agree.
8. Refresh discards the in-memory rows and reloads the 12 rows that the first request committed.

This explains all parts of the report: earlier data exists, the latest rows do not, the status is
failed rather than saved/unsaved, and print/close cannot continue.

The tests also show that a single 15-row database transaction does not partially commit. When the
fifteenth row fails ownership validation, all writes for rows 1–14 roll back. A saved prefix plus a
missing suffix therefore came from separate autosave generations.

## Related acknowledgement-loss defects

The same failure family has two additional data-integrity hazards.

### Same-count create replay can acknowledge data it did not save

Create replay currently verifies the stable estimate identity and the number of persisted rows. It
does not compare the changed item values, customer, notes, or ordering with the committed request.
If the first create commits, its response is lost, and the user changes the last three rows without
changing the row count, the retry returns 200 and acknowledges the new row IDs while retaining the
old database values. The renderer can therefore display Saved even though refresh restores the old
values.

### Retrying new rows on an existing estimate can duplicate them

New rows sent to an existing estimate have no persisted item ID. The server generates the ID during
insert. If that sync commits but its acknowledgement is lost, retrying the identical request inserts
the rows again because the client never received those generated IDs. The regression test records
three rows becoming six and the inventory aggregate being applied twice.

## Failure trigger matrix

| Boundary                            | Trigger                                                                                                                  | Observable result                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Local draft                         | No customer, no valid row, invalid price/quantity, or unfinished product search                                          | Flush rejects or remains Unsaved before an HTTP request                                   |
| Debounce/in-flight edit             | Rows change while an older request is running                                                                            | Supported when the acknowledgement arrives; a follow-up sync persists the newer revisions |
| Transport                           | Local API unavailable, connection reset, or fetch network failure                                                        | Rows remain dirty; status becomes Error                                                   |
| Timeout                             | No usable response within 15 seconds                                                                                     | Request is aborted; rows remain dirty; status becomes Error                               |
| Response protocol                   | Invalid JSON, missing row acknowledgement, unknown/duplicate row ID, or missing create identity                          | Response is rejected; rows remain dirty; status becomes Error                             |
| HTTP 400                            | Payload/schema failure, unsafe numeric range, notes/name length, checked quantity, or a surfaced SQLite constraint/error | Flush rejects; status becomes Error                                                       |
| HTTP 401                            | Renderer/local-server API token mismatch                                                                                 | Every sync request fails before the controller                                            |
| HTTP 404                            | Estimate was deleted, soft-deleted, or is otherwise missing before sync                                                  | Flush rejects; status becomes Error                                                       |
| HTTP 409                            | Create identity conflict, changed create replay row count, or item owned by another estimate                             | Flush rejects; status becomes Error                                                       |
| HTTP 500                            | Unexpected controller/service/repository exception                                                                       | Flush rejects; status becomes Error                                                       |
| Ambiguous create commit             | Create commits but acknowledgement is lost, then rows are added/removed                                                  | Retry is a permanent 409 until the client state is reconciled or refreshed                |
| Ambiguous create commit, same count | Create commits but acknowledgement is lost, then values/metadata change                                                  | Retry can falsely acknowledge stale persisted values                                      |
| Ambiguous existing sync             | New rows commit but acknowledgement with generated IDs is lost                                                           | A manual retry can duplicate rows and inventory deltas                                    |
| Competing editors                   | The same estimate is open in multiple tabs/windows and both mutate it                                                    | Last successful writes win; stale item ownership/identity can produce 409                 |

The 800 ms debounce affects when a request snapshot is taken, not how many rows the backend can
store. Rapid entry makes this incident more likely only because it creates a window in which the
request that committed and the local draft no longer contain the same rows.

## Why print and close were unavailable

Print & Close, Close Tab, and PDF export all await `flushSync()` first. On any rejected sync, the
footer deliberately avoids printing, removing the tab, or navigating away. This is a data-loss
guard, not the initiating defect. The buttons become available again after the failed action, but a
manual retry of the changed create continues to receive the same 409.

## Regression coverage added

`billing.ambiguous-commit.test.ts` covers:

- successful atomic persistence at 10, 12, and 15 rows;
- the exact 12-row commit followed by a 15-row replay and 409;
- same-count changed replay receiving a stale success acknowledgement;
- duplicate insertion after an existing-estimate acknowledgement loss;
- full rollback when the fifteenth row fails ownership validation.

`syncWorker.test.ts` covers:

- a 12-row create acknowledgement followed by a correct three-row incremental sync;
- a 12-row committed request timing out, a 15-row retry receiving 409, all 15 local rows remaining
  dirty, and the session staying in Error without a confirmed billing ID.

`SummaryFooter.test.tsx` covers:

- failed flush preventing print, tab removal, and navigation;
- Close Tab remaining on the estimate after failure and retrying only after another explicit click.

These are characterization/regression tests for the current implementation. Assertions that expose
unsafe behavior are intentionally labeled as characterization so the suite stays executable while
the production fix remains out of scope.

## Validation

- Full Vitest suite: 83 files and 719 tests passed.
- TypeScript: node, web, test, and Electron end-to-end configurations passed.
- ESLint: passed with 41 pre-existing warnings and no errors; none of the warnings are in the files
  changed by this investigation.

## Incident certainty and useful production evidence

The repository has no production request log for the reported event, so the initiating transport
event cannot be identified with certainty. The tests establish a deterministic code path that
matches every observed symptom. To distinguish timeout, local-server failure, malformed response,
or HTTP 409 in a future incident, capture:

- the application version;
- the console error immediately following `Billing sync failed`;
- the request endpoint, status code, and duration;
- the local server error at the same timestamp;
- whether the route was still `/billing/estimates/create` or had changed to an edit route.
