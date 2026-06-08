/* @ds-bundle: {"format":3,"namespace":"BuscaminasDesignSystem_4d7cc5","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Counter","sourcePath":"components/core/Counter.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Segmented","sourcePath":"components/forms/Segmented.jsx"},{"name":"Board","sourcePath":"components/game/Board.jsx"},{"name":"ModeCard","sourcePath":"components/game/ModeCard.jsx"},{"name":"PlayerTag","sourcePath":"components/game/PlayerTag.jsx"},{"name":"Tile","sourcePath":"components/game/Tile.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"51f3bdfed639","components/core/Button.jsx":"ea632ffc6281","components/core/Counter.jsx":"6d0cae1664f0","components/feedback/Dialog.jsx":"5ff8674586ee","components/forms/Input.jsx":"017b7fd872a9","components/forms/Segmented.jsx":"fed4c9d1356a","components/game/Board.jsx":"2d0e6cdfd1b9","components/game/ModeCard.jsx":"6503e49c0a0b","components/game/PlayerTag.jsx":"c361bc30c485","components/game/Tile.jsx":"5f89fb23f19c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BuscaminasDesignSystem_4d7cc5 = window.BuscaminasDesignSystem_4d7cc5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — compact status / label pill with optional neon glow.
 */
function Badge({
  children,
  tone = 'cyan',
  solid = false,
  dot = false,
  style = {},
  ...rest
}) {
  const tones = {
    cyan: 'var(--neon-cyan)',
    magenta: 'var(--neon-magenta)',
    lime: 'var(--neon-lime)',
    yellow: 'var(--neon-yellow)',
    red: 'var(--neon-red)',
    purple: 'var(--neon-purple)',
    neutral: 'var(--text-mid)'
  };
  const c = tones[tone] || tones.cyan;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '24px',
      padding: '0 10px',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: solid ? '#07070f' : c,
      background: solid ? c : 'color-mix(in srgb, ' + c + ' 14%, transparent)',
      border: `1px solid color-mix(in srgb, ${c} ${solid ? '0%' : '45%'}, transparent)`,
      boxShadow: solid ? `0 0 14px color-mix(in srgb, ${c} 50%, transparent)` : 'none',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: solid ? '#07070f' : c,
      boxShadow: solid ? 'none' : `0 0 6px ${c}`
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — primary action control with neon glow.
 * Variants: primary (cyan), secondary (magenta), ghost, danger, win.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const palette = {
    primary: {
      c: 'var(--neon-cyan)',
      glow: 'rgba(25,227,255,0.55)'
    },
    secondary: {
      c: 'var(--neon-magenta)',
      glow: 'rgba(255,46,151,0.55)'
    },
    win: {
      c: 'var(--neon-lime)',
      glow: 'rgba(157,255,61,0.55)'
    },
    danger: {
      c: 'var(--neon-red)',
      glow: 'rgba(255,59,92,0.55)'
    },
    ghost: {
      c: 'var(--neon-cyan)',
      glow: 'rgba(25,227,255,0.0)'
    }
  }[variant] || {};
  const sizes = {
    sm: {
      h: 'var(--ctl-sm)',
      px: '14px',
      fs: 'var(--fs-sm)'
    },
    md: {
      h: 'var(--ctl-md)',
      px: '20px',
      fs: 'var(--fs-body)'
    },
    lg: {
      h: 'var(--ctl-lg)',
      px: '28px',
      fs: 'var(--fs-lg)'
    }
  }[size];
  const isGhost = variant === 'ghost';
  const base = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--sp-2)',
    height: sizes.h,
    padding: `0 ${sizes.px}`,
    fontFamily: 'var(--font-display)',
    fontSize: sizes.fs,
    fontWeight: 600,
    letterSpacing: '0.02em',
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--r-md)',
    border: `2px solid ${palette.c}`,
    color: isGhost ? palette.c : '#07070f',
    background: isGhost ? 'transparent' : palette.c,
    boxShadow: isGhost ? 'none' : `0 0 18px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
    textShadow: isGhost ? `0 0 10px ${palette.glow}` : 'none',
    opacity: disabled ? 0.4 : 1,
    transition: 'transform var(--dur-fast) var(--ease-snap), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    WebkitFontSmoothing: 'antialiased',
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: base,
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onMouseEnter: e => {
      if (disabled) return;
      e.currentTarget.style.boxShadow = isGhost ? `0 0 20px ${palette.glow.replace('0.0', '0.4')}` : `0 0 28px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`;
      if (isGhost) e.currentTarget.style.background = 'rgba(25,227,255,0.08)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = base.boxShadow;
      if (isGhost) e.currentTarget.style.background = 'transparent';
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Counter.jsx
try { (() => {
/**
 * Counter — digital scoreboard readout (mines remaining, timer, score).
 * Renders zero-padded digits in the terminal font with a glowing tone.
 */
function Counter({
  value = 0,
  digits = 3,
  tone = 'cyan',
  label = null,
  icon = null,
  style = {}
}) {
  const tones = {
    cyan: 'var(--neon-cyan)',
    magenta: 'var(--neon-magenta)',
    lime: 'var(--neon-lime)',
    yellow: 'var(--neon-yellow)',
    red: 'var(--neon-red)'
  };
  const c = tones[tone] || tones.cyan;
  const text = String(Math.max(0, value)).padStart(digits, '0').slice(-digits);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '4px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xs)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--text-mid)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 14px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--bg-void)',
      border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
      boxShadow: `inset 0 0 14px color-mix(in srgb, ${c} 12%, transparent)`
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: c,
      display: 'inline-flex',
      filter: `drop-shadow(0 0 6px ${c})`
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-counter)',
      lineHeight: 1,
      letterSpacing: '0.08em',
      color: c,
      textShadow: `0 0 10px color-mix(in srgb, ${c} 60%, transparent)`,
      fontVariantNumeric: 'tabular-nums'
    }
  }, text)));
}
Object.assign(__ds_scope, { Counter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Counter.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Dialog — centered modal panel over a blurred scrim. Used for
 * win/lose results, pause menu, room settings. Presentational:
 * render conditionally (open && <Dialog .../>).
 */
function Dialog({
  title,
  eyebrow = null,
  tone = 'cyan',
  children,
  footer = null,
  onClose,
  width = 460,
  style = {}
}) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)' : tone === 'lime' ? 'var(--neon-lime)' : tone === 'red' ? 'var(--neon-red)' : 'var(--neon-cyan)';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-5)',
      background: 'rgba(5,5,12,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
      border: `2px solid color-mix(in srgb, ${c} 50%, transparent)`,
      borderRadius: 'var(--r-xl)',
      boxShadow: `var(--shadow-lg), 0 0 50px color-mix(in srgb, ${c} 28%, transparent)`,
      padding: 'var(--sp-6)',
      ...style
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xs)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: c,
      marginBottom: 'var(--sp-2)'
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-h2)',
      fontWeight: 700,
      color: 'var(--text-hi)',
      lineHeight: 1.1,
      textShadow: `0 0 18px color-mix(in srgb, ${c} 40%, transparent)`,
      marginBottom: 'var(--sp-4)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text)',
      fontSize: 'var(--fs-body)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--sp-3)',
      marginTop: 'var(--sp-6)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with neon focus ring. Use for room codes,
 * player names, etc. Forwards rest props to the <input>.
 */
function Input({
  label = null,
  hint = null,
  prefix = null,
  tone = 'cyan',
  mono = false,
  style = {},
  ...rest
}) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-2)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xs)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-mid)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      height: 'var(--ctl-md)',
      padding: '0 14px',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-input)',
      border: `2px solid ${focused ? c : 'var(--line)'}`,
      boxShadow: focused ? `0 0 0 3px color-mix(in srgb, ${c} 30%, transparent)` : 'none',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)'
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-dim)',
      fontFamily: 'var(--font-mono)'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'var(--text-hi)',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: mono ? '22px' : 'var(--fs-body)',
      letterSpacing: mono ? '0.15em' : 'normal'
    }
  }))), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-dim)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Segmented.jsx
try { (() => {
/**
 * Segmented — pill segmented control. Used for difficulty
 * (Fácil / Medio / Difícil) and other small exclusive choices.
 */
function Segmented({
  options = [],
  value,
  onChange,
  tone = 'cyan',
  style = {}
}) {
  const c = tone === 'magenta' ? 'var(--neon-magenta)' : tone === 'lime' ? 'var(--neon-lime)' : 'var(--neon-cyan)';
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'inline-flex',
      padding: 4,
      gap: 4,
      borderRadius: 'var(--r-pill)',
      background: 'var(--bg-void)',
      border: '1px solid var(--line)',
      ...style
    }
  }, options.map(opt => {
    const val = typeof opt === 'string' ? opt : opt.value;
    const lbl = typeof opt === 'string' ? opt : opt.label;
    const sel = val === value;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      type: "button",
      role: "tab",
      "aria-selected": sel,
      onClick: () => onChange && onChange(val),
      style: {
        border: 'none',
        cursor: 'pointer',
        padding: '8px 18px',
        borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-sm)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: sel ? '#07070f' : 'var(--text-mid)',
        background: sel ? c : 'transparent',
        boxShadow: sel ? `0 0 16px color-mix(in srgb, ${c} 55%, transparent)` : 'none',
        transition: 'all var(--dur-base) var(--ease-out)'
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { Segmented });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Segmented.jsx", error: String((e && e.message) || e) }); }

// components/game/ModeCard.jsx
try { (() => {
/**
 * ModeCard — a large selectable card for the three game modes
 * (solo / co-op / versus). Glows in its accent on hover/active.
 */
function ModeCard({
  title,
  subtitle,
  icon = null,
  tone = 'cyan',
  players = '1',
  active = false,
  onClick,
  style = {}
}) {
  const tones = {
    cyan: 'var(--neon-cyan)',
    magenta: 'var(--neon-magenta)',
    lime: 'var(--neon-lime)',
    purple: 'var(--neon-purple)'
  };
  const c = tones[tone] || tones.cyan;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-3)',
      width: '100%',
      padding: 'var(--sp-5)',
      borderRadius: 'var(--r-lg)',
      cursor: 'pointer',
      background: active ? `linear-gradient(180deg, color-mix(in srgb, ${c} 14%, var(--surface-2)), var(--surface-1))` : 'var(--surface-1)',
      border: `2px solid ${active ? c : 'var(--line)'}`,
      boxShadow: active ? `0 0 28px color-mix(in srgb, ${c} 35%, transparent)` : 'var(--shadow-md)',
      transition: 'all var(--dur-base) var(--ease-out)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = c;
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.5), 0 0 24px color-mix(in srgb, ${c} 30%, transparent)`;
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = active ? c : 'var(--line)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = active ? `0 0 28px color-mix(in srgb, ${c} 35%, transparent)` : 'var(--shadow-md)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 'var(--r-md)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `color-mix(in srgb, ${c} 16%, transparent)`,
      border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`,
      color: c,
      filter: `drop-shadow(0 0 8px ${c})`
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xs)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: c,
      padding: '4px 10px',
      borderRadius: 'var(--r-pill)',
      border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`
    }
  }, players, " ", players === '1' ? 'jugador' : 'jugadores')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-h3)',
      fontWeight: 700,
      color: 'var(--text-hi)',
      lineHeight: 1.1
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-mid)',
      lineHeight: 1.4
    }
  }, subtitle));
}
Object.assign(__ds_scope, { ModeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ModeCard.jsx", error: String((e && e.message) || e) }); }

// components/game/PlayerTag.jsx
try { (() => {
/**
 * PlayerTag — avatar + name + optional status, color-coded by player slot.
 * Used in lobbies, co-op HUDs and versus scoreboards.
 */
function PlayerTag({
  name,
  slot = 'p1',
  status = null,
  score = null,
  active = false,
  ready = false,
  style = {}
}) {
  const c = slot === 'p2' ? 'var(--player-2)' : slot === 'host' ? 'var(--neon-lime)' : 'var(--player-1)';
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: 'var(--sp-2) var(--sp-3)',
      borderRadius: 'var(--r-md)',
      background: active ? `color-mix(in srgb, ${c} 12%, var(--surface-1))` : 'var(--surface-1)',
      border: `1px solid ${active ? c : 'var(--line)'}`,
      boxShadow: active ? `0 0 18px color-mix(in srgb, ${c} 30%, transparent)` : 'none',
      transition: 'all var(--dur-base) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 'var(--r-sm)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `color-mix(in srgb, ${c} 18%, var(--bg-void))`,
      border: `2px solid ${c}`,
      color: c,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      boxShadow: `0 0 12px color-mix(in srgb, ${c} 45%, transparent)`
    }
  }, initial), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      color: 'var(--text-hi)',
      fontSize: 'var(--fs-body)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), (status || ready) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: ready ? 'var(--neon-lime)' : 'var(--text-mid)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, ready && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'var(--neon-lime)',
      boxShadow: '0 0 6px var(--neon-lime)'
    }
  }), ready ? 'Listo' : status)), score != null && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-h3)',
      color: c,
      textShadow: `0 0 8px color-mix(in srgb, ${c} 50%, transparent)`
    }
  }, score));
}
Object.assign(__ds_scope, { PlayerTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/PlayerTag.jsx", error: String((e && e.message) || e) }); }

// components/game/Tile.jsx
try { (() => {
const NUM_COLORS = {
  1: 'var(--num-1)',
  2: 'var(--num-2)',
  3: 'var(--num-3)',
  4: 'var(--num-4)',
  5: 'var(--num-5)',
  6: 'var(--num-6)',
  7: 'var(--num-7)',
  8: 'var(--num-8)'
};

/**
 * Tile — a single Minesweeper cell. The signature component.
 * state: "hidden" | "revealed" | "flagged" | "mine" | "exploded"
 * value: 0–8 (adjacent mines, shown when revealed)
 */
function Tile({
  state = 'hidden',
  value = 0,
  size = 'md',
  owner = null,
  // null | "p1" | "p2" — neon edge for co-op/versus ownership
  onClick,
  onContextMenu,
  style = {}
}) {
  const px = {
    sm: 'var(--tile-sm)',
    md: 'var(--tile-md)',
    lg: 'var(--tile-lg)'
  }[size];
  const ownerColor = owner === 'p1' ? 'var(--player-1)' : owner === 'p2' ? 'var(--player-2)' : null;
  const isHidden = state === 'hidden' || state === 'flagged';
  const numColor = NUM_COLORS[value];
  let face = {};
  if (isHidden) {
    face = {
      background: 'linear-gradient(180deg, var(--cell-up-2), var(--cell-up))',
      border: '1px solid var(--line-strong)',
      boxShadow: 'var(--shadow-inset-tile)'
    };
  } else if (state === 'exploded') {
    face = {
      background: 'radial-gradient(circle at 50% 45%, var(--neon-red), #2a0410 80%)',
      border: '1px solid color-mix(in srgb, var(--neon-red) 60%, transparent)',
      boxShadow: '0 0 22px rgba(255,59,92,0.7), inset 0 0 12px rgba(255,59,92,0.5)'
    };
  } else if (state === 'mine') {
    face = {
      background: 'var(--cell-down)',
      border: '1px solid color-mix(in srgb, var(--neon-red) 35%, transparent)'
    };
  } else {
    // revealed empty / numbered
    face = {
      background: 'var(--cell-down)',
      border: '1px solid var(--line-soft)',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
    };
  }
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onContextMenu: onContextMenu,
    style: {
      width: px,
      height: px,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      borderRadius: 'var(--r-tile)',
      cursor: isHidden ? 'pointer' : 'default',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: `calc(${px} * 0.5)`,
      lineHeight: 1,
      position: 'relative',
      transition: 'transform var(--dur-fast) var(--ease-snap), filter var(--dur-fast)',
      outline: ownerColor ? `2px solid color-mix(in srgb, ${ownerColor} 70%, transparent)` : 'none',
      outlineOffset: ownerColor ? '-1px' : 0,
      ...face,
      ...style
    },
    onMouseEnter: e => {
      if (isHidden) e.currentTarget.style.filter = 'brightness(1.25)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
    }
  }, state === 'flagged' && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--flag)',
      filter: 'drop-shadow(0 0 6px var(--flag))',
      fontSize: `calc(${px} * 0.5)`
    }
  }, "\u2691"), (state === 'mine' || state === 'exploded') && /*#__PURE__*/React.createElement("span", {
    style: {
      color: state === 'exploded' ? '#fff' : 'var(--mine)',
      filter: `drop-shadow(0 0 8px var(--mine))`,
      fontSize: `calc(${px} * 0.5)`
    }
  }, "\u2738"), state === 'revealed' && value > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: numColor,
      textShadow: `0 0 10px color-mix(in srgb, ${numColor} 55%, transparent)`
    }
  }, value));
}
Object.assign(__ds_scope, { Tile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Tile.jsx", error: String((e && e.message) || e) }); }

// components/game/Board.jsx
try { (() => {
/**
 * Board — a grid of Tiles rendered from a 2D cell array.
 * Each cell: { state, value, owner }. Purely presentational —
 * pass onCell(r, c, e) / onCellContext(r, c, e) to handle input.
 */
function Board({
  cells = [],
  size = 'md',
  framed = true,
  onCell,
  onCellContext,
  style = {}
}) {
  const cols = cells[0]?.length || 0;
  const tilePx = {
    sm: 28,
    md: 38,
    lg: 46
  }[size] || 38;
  const grid = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${tilePx}px)`,
      gap: 'var(--tile-gap)'
    }
  }, cells.flatMap((row, r) => row.map((cell, c) => /*#__PURE__*/React.createElement(__ds_scope.Tile, {
    key: `${r}-${c}`,
    state: cell.state,
    value: cell.value,
    owner: cell.owner,
    size: size,
    onClick: e => onCell && onCell(r, c, e),
    onContextMenu: e => {
      e.preventDefault();
      onCellContext && onCellContext(r, c, e);
    }
  }))));
  if (!framed) return /*#__PURE__*/React.createElement("div", {
    style: style
  }, grid);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      padding: 'var(--sp-4)',
      borderRadius: 'var(--r-lg)',
      background: 'var(--surface-1)',
      border: '1px solid var(--line)',
      boxShadow: 'var(--shadow-lg), inset 0 0 0 1px rgba(25,227,255,0.04)',
      ...style
    }
  }, grid);
}
Object.assign(__ds_scope, { Board });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Board.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Counter = __ds_scope.Counter;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Board = __ds_scope.Board;

__ds_ns.ModeCard = __ds_scope.ModeCard;

__ds_ns.PlayerTag = __ds_scope.PlayerTag;

__ds_ns.Tile = __ds_scope.Tile;

})();
