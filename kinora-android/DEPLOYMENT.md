# Deploy and verify Kinora

## Infrastructure inputs

Use a Linux server with Docker Compose, a public IPv4 address and a domain/subdomain whose DNS A record points to that IP. No provider-specific credentials are embedded in the project.

From `kinora-android/backend`:

```sh
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Edit `.env`: set `KINORA_DOMAIN`, `KINORA_PUBLIC_IP`, and the generated random `KINORA_TURN_SECRET`. Keep `.env` private. Do not use the example values. HTTPS and TURN use the same hostname. Open TCP 80/443, TCP+UDP 3478, and UDP 49160–49200 to the server; keep the API's internal 8080 port private.

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

The supplied Compose setup starts the API, Caddy for automatic HTTPS and coturn for authenticated relay. It assumes Linux host networking for TURN and a server with a directly reachable public IP. For cloud NAT, adjust coturn's external/internal IP mapping. TURN over TLS/443 is not included; some restrictive networks may need an additional dedicated relay endpoint.

Open `https://YOUR_HOST/health`, then `https://YOUR_HOST/ui`. Enter that same HTTPS origin in the Android app. If certificates are not valid, fix DNS/firewall/TLS; do not disable certificate validation.

This is a single-instance pilot. Before unrestricted public launch, add provider-level abuse protection, backups, monitoring, account verification/recovery and a production security/load review. The API's built-in IP limits see the reverse proxy's address, so a large deployment needs trusted-edge client-aware rate limiting.

## Verification checklist

1. Pair two physical test phones and verify another parent account cannot see them.
2. Confirm a non-enrolled child returns `unsupported` for blocking.
3. Enroll an eligible spare phone as Device Owner. Block a nonessential installed game, verify Android prevents launching it, then unblock and verify recovery.
4. Request each camera separately. Verify no capture before approval, correct lens, no audio and visible local preview.
5. Stop from both phones; background/lock the child phone; revoke pairing; disconnect the network; wait past five minutes. Confirm capture ends in every case.
6. Repeat video using different networks (Wi-Fi versus cellular) to test TURN. Check `/rtc/config` reports `relayConfigured: true` for an authenticated client.
7. Grant and revoke Usage Access, share location once and verify the report timestamp. There must be no unsolicited location upload.
8. Verify offline local disconnect releases Kinora app suspensions and removes the saved connection; inspect Device Owner removal on the test phone.
9. Restart the API/container and verify pairing/policy persists. Back up SQLite with its online backup API and protect the data volume.

## Tests

```sh
python -m unittest discover -s tests -v
npm install
# In another terminal, start the backend on port 8765 with a temporary database.
KINORA_PORT=8765 KINORA_DB=/tmp/kinora-tests.sqlite3 python server.py
# From the first terminal:
npm run test:ui
npx playwright install chromium
npm run test:browser
```

`test:ui` mocks media while exercising real HTTP. `test:browser` uses generated fake camera frames with actual browser WebRTC; neither replaces a physical front/back-camera and managed-device test.
