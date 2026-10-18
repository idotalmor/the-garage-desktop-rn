import { Button, Link } from '@heroui/react'
import { motion } from 'motion/react'
// Uncomment to restore the email/password form and Facebook sign-in:
// import { useState } from 'react'
// import { FieldError, Form, InputGroup, Label, TextField } from '@heroui/react'
// import { AnimatePresence, motion } from 'motion/react'
// import { Eye, EyeOff, Mail } from 'lucide-react'
import { useAuth } from '../hooks/use-auth'
import { WindowDragRegion } from '../../../shared/components/WindowDragRegion'
import trayIconUrl from '../../../../../../resources/tray-icon.png'

function GoogleLogo(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

// function FacebookLogo(): React.JSX.Element {
//   return (
//     <svg width="18" height="18" viewBox="0 0 512 512" aria-hidden="true">
//       <path
//         fill="#1877F2"
//         d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256c0 120 82.7 220.8 194.2 248.5V334.2h-52.8V256h52.8v-33.7c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287v175.9C413.8 494.8 512 386.9 512 256z"
//       />
//     </svg>
//   )
// }

export function LoginPage(): React.JSX.Element {
  const { isConfigured, signingIn, error, signIn } = useAuth()

  // Uncomment to restore the email/password form:
  // const [email, setEmail] = useState('')
  // const [password, setPassword] = useState('')
  // const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  // const showPassword = email.length > 1
  //
  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
  //   e.preventDefault()
  // }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <WindowDragRegion className="fixed inset-x-0 top-0 z-30 h-10" />

      <main className="mx-auto flex w-full max-w-lgs flex-1 flex-col items-center justify-center gap-16 px-6">
        <div className="flex -translate-x-10 items-center gap-4">
          <motion.span
            aria-hidden="true"
            className="size-34"
            initial={{ scale: 2.6, opacity: 0, y: -30, rotate: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              rotate: 360,
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              scale: { type: 'spring', stiffness: 110, damping: 14, delay: 0.15 },
              y: { type: 'spring', stiffness: 110, damping: 14, delay: 0.15 },
              opacity: { duration: 0.35, delay: 0.15 },
              rotate: { duration: 90, repeat: Infinity, ease: 'linear' },
              backgroundPosition: { duration: 5, repeat: Infinity, ease: 'linear' }
            }}
            style={{
              backgroundImage:
                'linear-gradient(120deg, var(--accent), #a78bfa, #f472b6, #60a5fa, var(--accent))',
              backgroundSize: '300% 300%',
              maskImage: `url(${trayIconUrl})`,
              WebkitMaskImage: `url(${trayIconUrl})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center'
            }}
          />
          <div className="flex flex-col">
            <motion.span
              className="text-xl text-muted"
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
            >
              Welcome to
            </motion.span>
            <motion.span
              className="text-7xl font-semibold tracking-tight"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.65 }}
            >
              The Garage
            </motion.span>
          </div>
        </div>

        {isConfigured ? (
          <motion.div
            className="flex w-full max-w-xs flex-col gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.9 }}
          >
            <Button
              variant="tertiary"
              fullWidth
              isPending={signingIn}
              onPress={() => void signIn()}
            >
              <GoogleLogo />
              Continue with Google
            </Button>

            {error && <p className="text-center text-sm text-danger">{error}</p>}

            {/*
            <Form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <TextField
                  name="email"
                  type="email"
                  isRequired
                  isDisabled={signingIn}
                  aria-label="Email"
                  value={email}
                  onChange={setEmail}
                  validate={(v) =>
                    !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                      ? null
                      : 'Please enter a valid email address'
                  }
                >
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Mail className="size-4 text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input autoComplete="email" placeholder="Email address" />
                  </InputGroup>
                  <FieldError />
                </TextField>

                <AnimatePresence mode="wait">
                  {showPassword && (
                    <motion.div
                      key="password-field"
                      initial={{ height: 0, opacity: 0, y: -20 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <TextField
                        className="w-full"
                        name="password"
                        isRequired
                        isDisabled={signingIn}
                        aria-label="Password"
                        value={password}
                        onChange={setPassword}
                      >
                        <Label className="sr-only">Password</Label>
                        <InputGroup>
                          <InputGroup.Input
                            className="w-full"
                            type={isPasswordVisible ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Password"
                          />
                          <InputGroup.Suffix className="pr-0">
                            <Button
                              isIconOnly
                              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                              size="sm"
                              variant="ghost"
                              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            >
                              {isPasswordVisible ? (
                                <Eye className="size-4" />
                              ) : (
                                <EyeOff className="size-4" />
                              )}
                            </Button>
                          </InputGroup.Suffix>
                        </InputGroup>
                        <FieldError />
                      </TextField>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button fullWidth type="submit">
                  Continue
                </Button>

                <div className="flex justify-end">
                  <Link className="text-xs text-muted no-underline hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <motion.div
                  layout
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-3"
                >
                  <div className="h-px flex-1 bg-separator" />
                  <span className="text-xs font-medium uppercase text-muted">or</span>
                  <div className="h-px flex-1 bg-separator" />
                </motion.div>

                <Button variant="tertiary" fullWidth isDisabled={signingIn}>
                  <FacebookLogo />
                  Continue with Facebook
                </Button>
              </div>
            </Form>

            <span className="mt-2 text-center text-sm font-medium text-muted">
              {"Don't have an account?"}{' '}
              <Link className="no-underline hover:underline">Sign up →</Link>
            </span>
            */}
          </motion.div>
        ) : (
          <motion.p
            className="text-center text-xs text-muted"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.9 }}
          >
            Firebase is not configured. Set the{' '}
            <code className="text-foreground">RENDERER_VITE_FIREBASE_*</code> and{' '}
            <code className="text-foreground">MAIN_VITE_GOOGLE_CLIENT_*</code> env vars and restart.
          </motion.p>
        )}
      </main>

      <motion.footer
        className="px-12 py-8 text-center text-sm text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 1.1 }}
      >
        By continuing, you agree to our{' '}
        <Link className="font-bold no-underline hover:underline">Terms</Link> and{' '}
        <Link className="font-bold no-underline hover:underline">Privacy</Link>
      </motion.footer>
    </div>
  )
}
