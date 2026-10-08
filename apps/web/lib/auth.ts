// The Better Auth instance lives in @workspace/auth so every app in the
// workspace shares one configuration. Re-exported here so existing `./auth`
// imports keep working.
export { auth, type AuthSession } from "@workspace/auth"
