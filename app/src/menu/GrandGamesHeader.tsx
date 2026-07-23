import type { Profile } from './useProfile';

/** Sticky top bar: GrandGames wordmark + player chip / sign-in shortcut. */
export function GrandGamesHeader({ profile, onSignIn }: { profile: Profile; onSignIn: () => void }) {
  const initial = profile.displayName.charAt(0).toUpperCase();
  const picture = profile.signedIn ? profile.google?.picture : '';

  return (
    <header className="gg-header">
      <span className="gg-brand">
        <span className="gg-brand__mark" aria-hidden>✷</span>
        <span className="gg-brand__word">GrandGames</span>
      </span>
      <span className="gg-spacer" />
      {profile.signedIn ? (
        <span className="gg-chip">
          {picture ? (
            <img className="gg-chip__avatar" src={picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="gg-chip__initial" aria-hidden>{initial}</span>
          )}
          <span className="gg-chip__name">{profile.displayName}</span>
        </span>
      ) : (
        <button type="button" className="gg-signin" onClick={onSignIn}>Iniciar sesión</button>
      )}
    </header>
  );
}
