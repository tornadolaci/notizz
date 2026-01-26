/**
 * Pastel color constants for notes and todos
 */
export const PASTEL_COLORS = {
	lavender: '#E6E6FA',
	peach: '#FFDAB9',
	mint: '#B2DFDB',
	sky: '#87CEEB',
	rose: '#FFB6C1',
	lemon: '#FFFACD',
	sage: '#B2D3C2',
	coral: '#FFB5A7'
} as const;

export type PastelColorKey = keyof typeof PASTEL_COLORS;

export const PASTEL_COLOR_NAMES: Record<PastelColorKey, string> = {
	lavender: 'Levendula',
	peach: 'Barack',
	mint: 'Menta',
	sky: 'Égkék',
	rose: 'Rózsa',
	lemon: 'Citrom',
	sage: 'Zsálya',
	coral: 'Korall'
};

// Default colors by entity type
export const DEFAULT_NOTE_COLOR: PastelColorKey = 'lemon'; // #FFFACD
export const DEFAULT_TODO_COLOR: PastelColorKey = 'mint'; // #B2DFDB
export const DEFAULT_COLOR: PastelColorKey = 'lavender'; // For backwards compatibility

/**
 * Convert HEX color value to PastelColorKey
 * Returns the key if found, otherwise returns the default color key
 */
export function hexToColorKey(hex: string): PastelColorKey {
	const upperHex = hex.toUpperCase();
	const entry = Object.entries(PASTEL_COLORS).find(([_, value]) => value.toUpperCase() === upperHex);
	return entry ? (entry[0] as PastelColorKey) : DEFAULT_COLOR;
}

/**
 * Dark mode color mapping - tint and glow variants for AMOLED theme
 */
export const DARK_TINT_COLORS: Record<PastelColorKey, string> = {
	lavender: '#2A2442',
	peach: '#3A261D',
	mint: '#163336',
	sky: '#152B3A',
	rose: '#3A1E2B',
	lemon: '#3A3516',
	sage: '#1E3228',
	coral: '#3A201A'
};

export const GLOW_COLORS: Record<PastelColorKey, string> = {
	lavender: '#B4AAFF',
	peach: '#FFB478',
	mint: '#78FFDC',
	sky: '#78C8FF',
	rose: '#FF78A0',
	lemon: '#FFF5AA',
	sage: '#96DCB4',
	coral: '#FF8C78'
};

/**
 * Get dark mode tint color for a given hex color
 */
export function getDarkTint(hex: string): string {
	const colorKey = hexToColorKey(hex);
	return DARK_TINT_COLORS[colorKey];
}

/**
 * Get glow color for a given hex color
 */
export function getGlowColor(hex: string): string {
	const colorKey = hexToColorKey(hex);
	return GLOW_COLORS[colorKey];
}
