/**
 * Orbit Architecture v2 — Design Tokens
 * Unified design tokens for colors, typography, spacing, radii, shadows, and z-index layers.
 * Aligned with Responsive Audit (iPhone 15 393×852 px & Desktop 1440×900 px).
 */

export const colors = {
    canvas: 'var(--md-matte, #F4F4F5)',
    surface: 'var(--md-surface, #FFFFFF)',
    surfaceMuted: 'var(--ds-surface-2, #FAFAFA)',
    line: 'var(--md-line, #E5E7EB)',
    lineStrong: 'var(--ds-border-strong, #D4D4D8)',

    // Typography
    ink: 'var(--md-ink, #09090B)',
    inkSecondary: 'var(--md-ink2, #27272A)',
    inkMuted: 'var(--md-muted, #52525B)',

    // Accents & Semantics (4 Unified Semantic Levels with >= 4.5:1 Contrast)
    primary: 'var(--md-primary, #9C4D31)',
    primaryHover: 'var(--md-primary-strong, #7F3D2B)',
    primarySurface: 'var(--md-primary-wash, rgba(156, 77, 49, 0.10))',

    ok: 'var(--md-ok, #15803D)',
    okSurface: 'rgba(21, 128, 61, 0.12)',

    warn: 'var(--md-warn, #B45309)',
    warnSurface: 'rgba(180, 83, 9, 0.12)',

    crit: 'var(--md-crit, #B91C1C)',
    critSurface: 'rgba(185, 28, 28, 0.12)',
};

export const spacing = {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
};

export const radii = {
    none: '0px',
    sm: '0.5rem',       // 8px
    DEFAULT: '0.75rem', // 12px unified radius for cards, inputs, buttons
    md: '0.75rem',      // 12px
    lg: '0.75rem',      // 12px
    xl: '1rem',         // 16px
    full: '9999px',     // Pills / Avatars only
};

export const shadows = {
    card: 'var(--md-shadow-card, 0 1px 2px rgba(9, 9, 11, 0.04))',
    dropdown: '0 4px 12px rgba(9, 9, 11, 0.10)',
    modal: 'var(--md-shadow-pop, 0 12px 40px rgba(9, 9, 11, 0.14))',
};

export const zIndex = {
    base: 0,
    sticky: 20,
    header: 40,
    bottomNav: 45,
    overlay: 50,
    drawer: 60,
    modalBackdrop: 65,
    modal: 70,
    dropdown: 75,
    toast: 80,
    tooltip: 90,
};

export const breakpoints = {
    xs: '360px',
    mobile: '393px',  // iPhone 15 reference viewport
    sm: '640px',
    tablet: '768px',
    md: '768px',
    laptop: '1024px',
    lg: '1024px',
    xl: '1280px',
    desktop: '1440px', // Desktop reference viewport
};

const serviceExports = {
    colors,
    spacing,
    radii,
    shadows,
    zIndex,
    breakpoints,
};

export default serviceExports;
