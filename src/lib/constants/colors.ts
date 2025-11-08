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
