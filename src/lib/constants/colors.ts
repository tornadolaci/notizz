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

export const DEFAULT_COLOR: PastelColorKey = 'lavender';
