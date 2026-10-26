# Kinora backend

Runnable single-instance REST API for accounts, device pairing, block/unblock command delivery and consent-gated WebRTC signaling. Python 3.11+ and SQLite; no Python packages to install.

## Run and test

```sh
cd kinora-android/backend
python -m unittest discover -s tests -v
python server.py
```

Listens on `127.0.0.1:8080`; health endpoint: `GET /health`.
Environment: `KINORA_HOST`, `KINORA_PORT`, `KINORA_DB` (default `kinora.sqlite3`).
Database and all token hashes survive restarts. Back up the SQLite database using SQLite's backup API, not by copying only the main file while WAL is active.

Docker:

```sh
docker build -t kinora-api .
docker run --rm -p 127.0.0.1:8080:8080 -v kinora-data:/data kinora-api
```

This is backend source, not a hosted service. Use a TLS reverse proxy before connecting phones over a network. Keep the backend port private; configure proxy body limits, request timeouts and per-client rate limits. The built-in limiter intentionally uses the TCP peer address and does not trust forwarded headers; clients behind one proxy share its IP quota. This server is designed for a small, single-instance pilot, not unrestricted public registration or multi-region production. Email verification, password recovery, operational monitoring and a production load test are not implemented.

## Authentication

JSON requests use `Content-Type: application/json`. Protected routes use `Authorization: Bearer TOKEN`. Parent tokens expire after 24 hours. Device tokens remain valid until the device is unpaired or the parent account is deleted. Keep tokens in protected device storage; never put them in URLs. No cross-origin browser access is enabled.

| Method | Route | Caller / body |
|---|---|---|
| POST | `/auth/register` | Public: `email`, `password` (12–128 characters) |
| POST | `/auth/login` | Public: `email`, `password`; returns parent `token` |
| POST | `/auth/logout` | Parent; revokes current token |
| DELETE | `/account` | Parent; cascades all devices, pairing codes, sessions and commands |
| POST | `/pairing` | Parent; returns 12-character code valid for five minutes; invalidates previous code |
| POST | `/pairing/claim` | Child: `code`, `name`, `approved_on_device: true`; returns `device_id`, `device_token` |
| GET | `/devices` | Parent; own devices only, includes last contact timestamp |
| DELETE | `/devices/{id}` | Owning parent or that child device; revoke pairing and associated records |
| GET | `/devices/{id}/policy` | Owning parent or child; desired app block state |
| POST | `/devices/{id}/commands` | Parent: `package`, `action: block\|unblock` |
| GET | `/devices/{id}/commands` | Parent or child; command delivery and result history |
| POST | `/devices/{id}/commands/{command}/ack` | Child: `state: applied\|failed\|unsupported`, optional `detail` |
| POST | `/devices/{id}/camera` | Parent: `lens: front\|back`; requests session, not camera activation |
| GET | `/devices/{id}/camera` | Parent or child; latest session requests |
| GET | `/camera/{id}` | Parent or child; session state and expiry |
| POST | `/camera/{id}/decision` | Child only: `approved: true\|false` |
| POST | `/camera/{id}/stop` | Either participant; ends session and deletes signaling |
| POST | `/camera/{id}/signals` | Active session: `kind: offer\|answer\|ice`, `payload` string |
| GET | `/camera/{id}/signals?after=0` | Active session; other participant's messages after cursor |

Errors return `{"error":"message"}` with HTTP 400/401/403/404/409/413/415/429. Missing or foreign resources do not reveal another family's data. Response bodies disable caching.

## Pairing lifecycle

1. Parent registers or logs in, then creates a pairing code.
2. On the child phone, explain what pairing permits and require explicit confirmation before submitting the code.
3. A successful claim consumes the code atomically, even under concurrent requests.
4. Store the device token only on the child device. The parent never receives it.
5. Either participant can revoke pairing. Clients must stop their active camera stream and clear credentials on a 401/404 response.

## App blocking contract

Commands are durable and expire after 24 hours. A newer command for the same package supersedes an older pending command. Desired policy remains until changed/unpaired. Poll commands while connected; reconcile desired policy on reconnect. Check latest desired state before applying an older fetched command. Commands must be handled idempotently.

An accepted request means **pending**, not blocked. The Android client must enforce the operation using an appropriate platform-supported management capability and only then acknowledge `applied`. If enrollment or permissions do not permit enforcement, return `unsupported`; report platform failures as `failed`. Protect emergency calling, default dialer, launcher, system UI, settings, accessibility necessities and Kinora itself using runtime role/package checks as well as the backend's basic protected package list. Do not block arbitrary system packages just because the API accepts a syntactically valid name. Server policy is not a substitute for Android enforcement.

The Android connected client now consumes these endpoints. Actual enforcement requires Device Owner enrollment; foreground sync and periodic background reconciliation report platform results. Physical-device enforcement remains unverified.

## Camera / WebRTC contract

Requests expire after 60 seconds without a decision. Only the paired child device can approve; parent credentials cannot approve on its behalf. Approval grants at most five minutes. The approved lens is immutable; switching front/back requires stopping and requesting a new session. The server trusts the authenticated child client's report of approval: the client must show the prompt and enforce the UI, not auto-approve.

After approval, the child creates a WebRTC offer and the parent returns an answer. Both exchange ICE candidates through the cursor endpoint. `payload` is a UTF-8 string containing SDP or JSON-serialized ICE candidate data. Offer is child-only; answer is parent-only; one offer/answer per session. No signaling is available before consent or after stop/expiry. SDP/ICE entries are capped at 200 per session, 32 KB each, and deleted when the session closes. Expiry cleanup is lazy on authenticated API calls; it also purges expired history after one day. The SQLite file is not encrypted by this code: use encrypted storage and restricted backups for deployments.

Client requirements:
- Request Android camera permission, show persistent local preview and a prominent Stop control.
- Start capture only after the local confirmation and successful server approval.
- Stop all camera tracks on local Stop, app backgrounding, screen lock, connection loss, token revocation or session expiry.
- Poll session state while streaming (e.g. every two seconds); a remote stop must also close the peer connection. Server signaling alone cannot force an already-established peer-to-peer stream to close.
- Do not enable microphone or recording implicitly.
- Provision authenticated TURN for reliable connections across mobile networks. TURN hosting/credentials and native WebRTC capture/rendering are not included in this backend.

The API carries signaling only; it does not capture, relay or record video. The shared web client now implements consent-gated WebRTC capture/rendering inside the Android WebView and supported browsers. `compose.yaml` supplies a TURN deployment configuration. Real video transport and physical camera operation remain unverified in this environment.

## Verified

15 automated backend tests pass (plus a mocked-media UI/API integration test): auth/logout, pairing consent/expiry/replay and race, cross-family/device access isolation, command lifecycle and supersession, camera approval/denial/expiry/signaling/stop, revocation/account deletion, hashed credentials, failed-attempt rate limits, restart persistence and actual HTTP requests.

Android compilation and signed development APK generation passed using SDK tools. Not verified: live deployment, physical-phone behavior, app enforcement, real camera transport, TURN connectivity or production load/security review.

## Connected interface and deployment

Open `/ui` for the parent/child interface. Static assets are served with a strict same-origin CSP. Authenticated `/rtc/config` returns time-limited TURN credentials from `KINORA_TURN_URLS` and `KINORA_TURN_SECRET`. `/devices/{id}/telemetry` accepts child-only inventory/usage/location updates; the owning parent reads them with GET. Reports expire from reads after 24 hours, and one-time location keeps its own timestamp across inventory refreshes. No background geolocation is requested. See [deployment instructions](../DEPLOYMENT.md).
