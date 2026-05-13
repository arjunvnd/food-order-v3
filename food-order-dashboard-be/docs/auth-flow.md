# Authentication Flow

MallBite uses Auth0 for identity. The backend validates JWTs; roles come from the database (not Auth0 claims).

## Login Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as React Frontend
    participant A0 as Auth0
    participant BE as Backend API
    participant DB as PostgreSQL

    U->>FE: Click "Sign In"
    FE->>A0: loginWithRedirect()\nredirect_uri = /auth/callback
    A0->>U: Show hosted login page
    U->>A0: Enter credentials
    A0->>FE: Redirect to /auth/callback\nwith authorization code
    FE->>A0: Exchange code for tokens\n(handled by Auth0 SDK)
    A0-->>FE: Access token (JWT) + ID token

    Note over FE: CallbackPage mounts
    FE->>FE: setTokenGetter(getAccessTokenSilently)\nwires Axios interceptor

    FE->>BE: POST /api/auth/sync\nAuthorization: Bearer <JWT>
    BE->>BE: requireAuth: validate JWT\nsignature + audience + issuer
    BE->>DB: UPSERT user WHERE auth0Sub = token.sub\n(creates on first login, updates email/name)
    DB-->>BE: User record with role
    BE-->>FE: { id, email, name, role, mallId, vendorId }

    FE->>FE: Dispatch setAuthUser to Redux\nstore role + user info

    alt role = "ADMIN"
        FE->>U: Navigate to /admin
    else role = "VENDOR"
        FE->>U: Navigate to /vendor
    else no role (new VENDOR default)
        FE->>U: Navigate to /unauthorized
    end
```

## Token Lifecycle

```mermaid
flowchart TD
    A[User visits protected page] --> B{Redux auth.isAuthenticated?}
    B -->|No| C[ProtectedRoute redirects to /login]
    B -->|Yes| D{auth.role matches route?}
    D -->|No| E[RoleGuard redirects to /unauthorized]
    D -->|Yes| F[Page renders]

    F --> G[Component calls API]
    G --> H[Axios request interceptor fires]
    H --> I[getAccessTokenSilently — returns\ncached token or silently refreshes]
    I --> J[Attach Authorization: Bearer token]
    J --> K[Request sent to backend]

    K --> L{Token valid?}
    L -->|No — expired/invalid| M[Backend returns 401]
    M --> N[Frontend logs out / redirects to login]
    L -->|Yes| O[Backend processes request]
```

## Role Mapping

| Auth0 → DB role                  | Frontend role | Access                                  |
| -------------------------------- | ------------- | --------------------------------------- |
| `VENDOR` (default for new users) | `"vendor"`    | `/vendor/*` routes                      |
| `ADMIN`                          | `"admin"`     | `/admin/*` routes                       |
| `SUPER_ADMIN`                    | `"admin"`     | `/admin/*` routes (no dedicated UI yet) |

> **Note:** Every new user who signs up with Auth0 starts with the `VENDOR` role (Prisma schema default). To grant admin access via the API use `POST /api/super-admin/malls/:mallId/admins`. Alternatively update the DB directly:
>
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
> ```

> **SUPER_ADMIN on admin routes:** `SUPER_ADMIN` users are accepted by all `/api/admin/*` endpoints (not just `/api/super-admin/*`). If they have no `MallAdmin` row the backend falls back to the first mall in the database.

## Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant A0 as Auth0

    U->>FE: Click "Logout"
    FE->>FE: dispatch(clearAuth()) — clear Redux state
    FE->>A0: logout({ returnTo: window.location.origin + "/login" })
    A0->>A0: Invalidate Auth0 session
    A0->>FE: Redirect to /login
```

> **Important:** The `returnTo` URL must be listed in the Auth0 application's **Allowed Logout URLs** setting (Auth0 Dashboard → Applications → your SPA → Settings). If it is missing, Auth0 shows an "Oops, something went wrong" error page.
>
> For local development add: `http://localhost:5173/login`

## Security Notes

- JWT validation uses Auth0's **JWKS endpoint** — signature is cryptographically verified (RS256), never just decoded
- `requireAuth` is provided by `express-oauth2-jwt-bearer` (Auth0's official library)
- `requireRole` queries the **database** for the user's role on every request — Auth0 cannot grant elevated DB permissions
- Access tokens are **never stored in localStorage** — the Auth0 SDK keeps them in memory and refreshes silently via a hidden iframe
