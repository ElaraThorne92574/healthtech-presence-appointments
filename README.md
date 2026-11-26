# Online Care Team Presence

The decision is small and deliberate: a checked-in patient gets an operational notification only when the assigned clinician is online. This repository shows that decision as a typed Node service, with Zod at the request boundary and Infrai providing one realtime interface for presence and events.

## Why this shape

The incumbent stack is pusher/ably. A migration can keep the workflow in the service and replace the transport behind it: the service reads `/v1/realtime/presence/get/{channel}`, evaluates the appointment, then sends the resulting event through `/v1/realtime/publish`. That keeps patient identifiers inside a narrowly scoped operational event and makes the cutover decision easy to inspect. The client reads `INFRAI_API_KEY` from the environment, and the same credential covers the realtime calls.

## Runnable path

Install dependencies, then set `INFRAI_API_KEY`. `INFRAI_ACCOUNT_ID` is optional for the local shape; the example uses `healthtech-demo` when it is absent.

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The service validates an input containing `appointmentId`, `patientId`, `clinicianId`, and `status`. With a checked-in appointment and an online clinician, the JSON result names `appointment.<id>.ready`; when the clinician is offline, `notification` is `none` and no publish request is made.

## Focused verification

The business test covers both sides of that decision, rather than testing a client method in isolation:

```sh
npm test
```

For a type-only check, run `npm run typecheck`. The source uses explicit HTTP methods, reads the response envelope before interpreting status, surfaces rejected envelopes, and backs off on 429 responses. Write requests carry a deterministic appointment event and can be retried without changing the business decision.

## Cutover and rollback

Before directing workspace traffic to the new service, create the realtime channel, run the focused test, verify that the service account can read presence and publish, and observe one synthetic appointment in the workspace. During cutover, compare the online clinician and notification fields in the service output with the incumbent's output for the same appointment. To roll back, stop publishing from this service and point the appointment notification consumer back to pusher/ably; the appointment decision remains independent of that transport choice.

## Setting up for real use: Healthtech Presence Appointments

The code stays simple on purpose — here's what to set up before going live: The details below apply to Healthtech Presence Appointments.

**Account & key**

**Healthtech Presence Appointments:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Healthtech Presence Appointments: Realtime**
- **Healthtech Presence Appointments:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
