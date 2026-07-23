import { forwardRef } from 'react';
import type { Profile } from './useProfile';
import { useGoogleSignIn, disableGoogleAutoSelect } from './useGoogleSignIn';

/**
 * Identity panel: avatar + editable name, plus Google sign-in (guest) or a
 * sign-out button (signed in). The name feeds the whole suite via useProfile.
 */
export const ProfileBar = forwardRef<HTMLDivElement, { profile: Profile }>(
  function ProfileBar({ profile }, ref) {
    const { name, displayName, signedIn, google } = profile;
    const initial = displayName.charAt(0).toUpperCase();
    const picture = signedIn ? google?.picture : '';

    const { buttonRef, failed } = useGoogleSignIn({
      active: !signedIn,
      onProfile: profile.setGoogle,
    });

    const handleSignOut = () => {
      disableGoogleAutoSelect();
      profile.signOut();
    };

    return (
      <div ref={ref} className="gg-profile pop-in">
        <div className="gg-profile__id">
          {picture ? (
            <img className="gg-profile__avatar" src={picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="gg-profile__initial" aria-hidden>{initial}</span>
          )}
          <div className="gg-profile__meta">
            <span className="gg-eyebrow">Jugador</span>
            <span className="gg-profile__name">{displayName}</span>
            <span className="gg-profile__session">
              {signedIn
                ? `Sesión con Google · ${google?.email || ''}`
                : 'Invitado — inicia sesión para guardar tu progreso'}
            </span>
          </div>
        </div>

        <div className="gg-profile__controls">
          <label className="gg-field">
            <span className="gg-eyebrow">{signedIn ? 'Nombre en el juego' : 'Juega como invitado'}</span>
            <input
              className="gg-name-input"
              value={name}
              maxLength={20}
              placeholder="Tu nombre"
              onChange={(e) => profile.setName(e.target.value)}
            />
          </label>

          {!signedIn && (
            <div className="gg-field">
              <span className="gg-eyebrow">O con tu cuenta</span>
              <div className="gg-google-slot" ref={buttonRef} />
            </div>
          )}

          {!signedIn && failed && (
            <span className="gg-hint">
              El botón de Google aparece en un dominio autorizado (localhost o tu dominio de Vercel).
            </span>
          )}

          {signedIn && (
            <button type="button" className="gg-signout" onClick={handleSignOut}>Cerrar sesión</button>
          )}
        </div>
      </div>
    );
  },
);
