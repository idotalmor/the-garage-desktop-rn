import { Loader2 } from 'lucide-react'
import { Avatar, Button } from '@heroui/react'
import { useAuth } from '../hooks/use-auth'

export function AuthControl(): React.JSX.Element {
  const { user, status, isConfigured, signingIn, error, signIn, logOut } = useAuth()

  if (!isConfigured) {
    return (
      <Avatar className="mt-1 size-6" aria-label="Account">
        <Avatar.Fallback>IO</Avatar.Fallback>
      </Avatar>
    )
  }

  const initials = (user?.displayName ?? user?.email ?? '?')
    .split(/[\s@]+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const label =
    status === 'signed-in'
      ? `Signed in as ${user?.displayName ?? user?.email}. Click to sign out`
      : signingIn
        ? 'Signing in… click to cancel'
        : 'Sign in with Google'

  const onPress = (): void => {
    if (status === 'signed-in') void logOut()
    else if (signingIn) window.api.auth.cancelSignIn()
    else void signIn()
  }

  return (
    <span title={error ?? label} className="inline-flex">
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="mt-1 size-7 rounded-full text-muted hover:text-foreground"
        aria-label={label}
        isDisabled={status === 'loading'}
        onPress={onPress}
      >
        {signingIn ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Avatar className="size-6" aria-hidden="true">
            {status === 'signed-in' && user?.photoURL ? (
              <Avatar.Image src={user.photoURL} alt="" />
            ) : null}
            <Avatar.Fallback>{status === 'signed-in' ? initials : '?'}</Avatar.Fallback>
          </Avatar>
        )}
      </Button>
    </span>
  )
}
