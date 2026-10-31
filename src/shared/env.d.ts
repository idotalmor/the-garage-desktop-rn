interface ImportMetaEnv {
  /** Public key (base64 SPKI DER, ed25519) that JS bundles must be signed with; set by CI, empty = updates off. */
  readonly MAIN_VITE_BUNDLE_PUBLIC_KEY?: string
  readonly MAIN_VITE_GITHUB_CLIENT_ID?: string
  readonly MAIN_VITE_GOOGLE_CLIENT_ID?: string
  readonly MAIN_VITE_GOOGLE_CLIENT_SECRET?: string
  readonly RENDERER_VITE_FIREBASE_API_KEY?: string
  readonly RENDERER_VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly RENDERER_VITE_FIREBASE_PROJECT_ID?: string
  readonly RENDERER_VITE_FIREBASE_APP_ID?: string
}
