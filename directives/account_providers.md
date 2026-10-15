# Account sign-in providers

## Goal

GitHub is the live sign-in. One button both signs in and creates the account. Apple and Google stay planned until their client keys exist. Do not draw those buttons before the worker can finish the login.

## GitHub (live)

The button is `GithubSignIn.vue`. It uses GitHub’s mark on `#24292F` with white type. The login page shows the full-width control. The desktop builder header shows the shorter one. Phone and iPad open `/login` from the account mark.

The worker route is `POST /api/auth/github`, then GitHub’s authorize URL, then `GET /api/auth/github/callback`. It needs `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` on the worker. Missing keys return `github`, and the login page shows that error.

## Google (planned)

Use OpenID Connect, the same state cookie and session token as GitHub.

1. Create a Google Cloud OAuth client of type Web. Redirect URI: `{worker-origin}/api/auth/google/callback`.
2. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the worker.
3. Add `google_sub TEXT UNIQUE` on `users`. Keep `github_login` as the account handle: derive it from the email name and resolve collisions. Do not use the email as the primary key.
4. Request scopes `openid`, `email`, and `profile`. Read the `sub` claim after verifying the ID token.
5. Add the button under the GitHub control, only when the keys exist. Follow Google’s button rules: white surface, the color G mark, the words “Sign in with Google” / “Logga in med Google”. Do not recolor the mark.

## Apple (planned)

Sign in with Apple is a separate developer setup. The client secret is a JWT you sign with the Apple `.p8` key. It expires within six months, so the worker mints it. Do not store a long-lived secret.

1. Apple Developer: Services ID, domain verification, return URL `{worker-origin}/api/auth/apple/callback`, and a Sign in with Apple key (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_SERVICE_ID`, `APPLE_PRIVATE_KEY`).
2. Apple sends the result as a form POST. The name and email arrive only on the first consent. Save them then. Later logins may only send the subject. Relay addresses (`@privaterelay.appleid.com`) are normal.
3. Add `apple_sub TEXT UNIQUE`. Verify the identity token against Apple’s keys.
4. The button, when the keys exist, sits with the GitHub control. Use Apple’s mark and the exact words “Sign in with Apple” / “Logga in med Apple”, on black or white. Do not redraw the logo.
5. A later iOS app that offers GitHub or Google must also offer Sign in with Apple. The website can add Apple on its own.

## Edge cases

- `github_login` is `NOT NULL UNIQUE` today, including for password accounts. A Google or Apple user still needs a handle.
- Show a provider button only after its worker route returns a redirect URL. A control that cannot sign in is not a login.
