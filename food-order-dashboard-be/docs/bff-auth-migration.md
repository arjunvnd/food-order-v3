# feat: migrate auth to Backend-for-Frontend (BFF) pattern

## Background

The current auth setup stores Auth0 tokens in `localStorage` (`cacheLocation="localstorage"` on `Auth0Provider`). This was a workaround to stop users being logged out on page refresh, but it exposes tokens to JavaScript and is vulnerable to XSS.

The fix is to move to a **Backend-for-Frontend (BFF)** pattern: the Express backend handles the Auth0 PKCE flow and stores the session in an **HTTP-only, `SameSite=Strict` cookie**. The frontend never sees a token at all.

## Task

Copy the prompt below and paste it into an LLM (e.g. GitHub Copilot, Claude, ChatGPT) inside this repo. It contains full implementation instructions.

---

## LLM Prompt — copy everything inside the code block

```
Implement a Backend-for-Frontend (BFF) auth migration for this monorepo.
The monorepo has two apps:
- food-order-v2 — React/Vite SPA (TypeScript, Redux Toolkit, Axios, @auth0/auth0-react)
- food-order-dashboard-be — Express + TypeScript backend (Prisma, express-oauth2-jwt-bearer)

CURRENT AUTH FLOW (to be replaced):
1. Auth0Provider in food-order-v2/src/main.tsx handles login/callback
2. CallbackPage.tsx wires getAccessTokenSilently into Axios via setTokenGetter in services/api.ts
3. Every API request sends Authorization: Bearer <token>
4. Backend validates JWT in src/middlewares/auth.ts via express-oauth2-jwt-bearer
5. POST /api/auth/sync upserts the user and returns role/vendorId
6. ProtectedRoute.tsx calls setAuthUser thunk on refresh to restore Redux state

TARGET FLOW:
1. Frontend "Login" button redirects to GET /api/auth/login on the backend
2. Backend redirects to Auth0 authorization URL
3. Auth0 redirects back to GET /callback on the backend
4. Backend exchanges code for tokens, encrypts session in an HTTP-only SameSite=Strict cookie, redirects to frontend /auth/callback
5. All Axios calls use withCredentials: true — cookie is sent automatically, no Authorization header
6. GET /api/auth/me reads the session cookie and returns the current user's profile
7. Frontend restores Redux state by calling /api/auth/me on every app load

--- BACKEND CHANGES (food-order-dashboard-be) ---

1. Install dependencies:
   npm install express-openid-connect cookie-parser
   npm install --save-dev @types/cookie-parser
   npm uninstall express-oauth2-jwt-bearer

2. src/config/config.ts — add three new fields:
   Interface additions:
     auth0ClientSecret: string  // Auth0 app client secret
     auth0BaseUrl: string       // base URL of the backend, e.g. http://localhost:3000
     auth0Secret: string        // random 32+ char string for session cookie encryption
   Load from env:
     auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET || ''
     auth0BaseUrl: process.env.AUTH0_BASE_URL || 'http://localhost:3000'
     auth0Secret: process.env.AUTH0_SECRET || ''

3. src/app.ts — mount express-openid-connect before all routes:
   import cookieParser from 'cookie-parser'
   import { auth } from 'express-openid-connect'

   app.use(cookieParser())
   app.use(auth({
     authRequired: false,
     auth0Logout: true,
     secret: config.auth0Secret,
     baseURL: config.auth0BaseUrl,
     clientID: config.auth0ClientId,
     clientSecret: config.auth0ClientSecret,
     issuerBaseURL: `https://${config.auth0Domain}`,
     authorizationParams: {
       response_type: 'code',
       audience: config.auth0Audience,
       scope: 'openid profile email offline_access',
     },
     routes: {
       callback: '/callback',
       postLogoutRedirect: process.env.FRONTEND_URL || 'http://localhost:5173',
     },
     afterCallback: async (_req, _res, session) => ({
       ...session,
       returnTo: `${process.env.FRONTEND_URL}/auth/callback`,
     }),
     session: {
       cookie: {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'Strict',
       },
     },
   }))
   This auto-registers GET /login, GET /logout, GET /callback.

4. src/middlewares/auth.ts — replace express-oauth2-jwt-bearer with:
   import { requiresAuth } from 'express-openid-connect'
   export const requireAuth = requiresAuth()
   Controllers that previously used req.auth?.payload.sub should now use req.oidc.user?.sub.
   Controllers that previously used req.auth?.payload['email'] should now use req.oidc.user?.email.

5. src/controllers/authController.ts — update syncUser:
   Replace:
     const auth0Sub = req.auth?.payload.sub as string
     const email = req.body?.email || req.auth?.payload['email']
     const name = req.body?.name || req.auth?.payload['name']
   With:
     const auth0Sub = req.oidc.user?.sub as string
     const email = req.oidc.user?.email as string | undefined
     const name = req.oidc.user?.name as string | undefined
   Rename the function from syncUser to syncOrGetUser.
   Change the method from POST handler to GET handler (no req.body used anymore).

6. src/routes/authRoutes.ts — replace POST /sync with GET /me:
   import { syncOrGetUser } from '../controllers/authController'
   router.get('/me', requireAuth, syncOrGetUser)
   Remove the old POST /sync route.

7. New .env variables to document:
   AUTH0_CLIENT_SECRET=<Auth0 app client secret>
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_SECRET=<run: openssl rand -hex 32>

8. Auth0 Dashboard changes (document in a comment, don't implement):
   - Add http://localhost:3000/callback to Allowed Callback URLs
   - Add http://localhost:5173 to Allowed Logout URLs

--- FRONTEND CHANGES (food-order-v2) ---

1. Uninstall: npm uninstall @auth0/auth0-react

2. src/main.tsx — remove Auth0Provider entirely. The file should render:
   <StrictMode>
     <Provider store={store}>
       <ThemeProvider theme={theme}>
         <CssBaseline />
         <RouterProvider router={router} />
       </ThemeProvider>
     </Provider>
   </StrictMode>

3. src/services/api.ts:
   - Remove the setTokenGetter export and getTokenFn module variable
   - Remove the request interceptor that injected Authorization: Bearer
   - Add withCredentials: true to the axios.create() call
   - Keep the Decimal coercion response interceptor unchanged

4. src/store/slices/authSlice.ts — rewrite setAuthUser thunk:
   - Remove the auth0User parameter
   - Replace api.post('/auth/sync', ...) with api.get('/auth/me')
   - Map the response the same way: role ADMIN|SUPER_ADMIN → 'admin', VENDOR → 'vendor'
   - Return the same shape: { user: { sub, email, name, picture }, role, vendorId, isProfileComplete }
   - Use data.id as the sub field since the backend /me returns the DB id

5. src/pages/auth/CallbackPage.tsx — remove all useAuth0() usage:
   - The backend already handled code exchange, this page just needs to:
     1. dispatch(setAuthUser()) with no arguments
     2. Navigate based on role: admin → /admin, vendor (incomplete profile) → /vendor/profile?setup=true, vendor → /vendor
     3. On failure navigate to /login
   - Show a CircularProgress spinner while dispatching

6. src/components/common/ProtectedRoute.tsx — remove all useAuth0() usage:
   - Use only Redux state: const { isAuthenticated, isLoading, role } = useAppSelector(s => s.auth)
   - On mount, if !isAuthenticated && !isLoading && !role: dispatch(setAuthUser())
   - If the dispatch rejects (401 from backend = no session), redirect to /login
   - Show spinner while bootstrapping

7. src/hooks/useRole.ts:
   - Remove the useAuthToken export (it called getAccessTokenSilently)
   - Keep useRole and useIsRole unchanged

8. src/components/common/Navbar.tsx:
   - Replace const { user, logout } = useAuth0() with:
     const user = useAppSelector(s => s.auth.user)
     const handleLogout = () => { window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout` }

9. Any other component using useAuth0() — search the codebase and replace:
   - user → useAppSelector(s => s.auth.user)
   - isAuthenticated → useAppSelector(s => s.auth.isAuthenticated)
   - isLoading → useAppSelector(s => s.auth.isLoading)
   - loginWithRedirect() → window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/login`
   - logout() → window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`
   - getAccessTokenSilently → remove entirely

WHAT STAYS UNCHANGED:
- All vendor, admin, super-admin, order, menu controllers and routes
- src/middlewares/rbac.ts
- Redux authSlice state shape (AuthState interface)
- The clearAuth action and its reducer
- All Prisma queries
- The SyncResponse type shape (same fields from GET /me as from POST /sync)
```

---
