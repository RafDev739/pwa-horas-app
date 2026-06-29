export const colors = {
  // Primary blues
  primaryDarkNavy: '#062134',
  primaryMediumNavy: '#0C3C60',
  primaryRoyalBlue: '#0D13AB',
  primaryMediumBlue: '#0C499C',
  primaryDeepBlue: '#183D83',

  // Accent
  accentOrange: '#E98520',
  accentOrangeSecondary: '#F7901E',
  accentLightBlue: '#1B99E8',

  // Backgrounds
  backgroundDark: '#000000',
  backgroundLight: '#FFFFFF',
  backgroundCream: '#ECF5E6',
  backgroundLightBlue: '#DAEDFF',
  backgroundBlueGray: '#AFCBE0',

  // Interactive
  interactiveBrightBlue: '#116DFF',
  interactiveLinkBlue: '#0000EE',
  interactiveBorderBlue: '#1468A8',

  // Semantic
  favorableGreen: '#28A745',
  unfavorableRed: '#DC3545',
  characteristicsPurple: '#6F42C1',
  neutralGray: '#959595',

  // Text
  textOnDark: '#FFFFFF',
  textOnDarkSecondary: 'rgba(255,255,255,0.7)',
  textOnDarkTertiary: 'rgba(255,255,255,0.5)',
} as const;

// Per-period accent colors for cells
export const periodColors: Record<string, string> = {
  A: '#0C499C',
  B: '#6F42C1',
  C: '#0D13AB',
  D: '#183D83',
  E: '#DC3545',
  F: '#28A745',
  G: '#E98520',
};
