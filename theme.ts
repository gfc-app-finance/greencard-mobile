import { vars } from 'nativewind';

export const lightTheme = vars({
  '--radius': '16',
  '--background': '255 255 255',
  '--foreground': '23 23 23',
  '--primary': '15 118 110', // #0F766E
  '--primary-foreground': '255 255 255',
  '--secondary': '223 244 241', // #DFF4F1
  '--secondary-foreground': '15 118 110',
  '--border': '228 228 231',
  '--input': '244 244 245',
});

export const darkTheme = vars({
  '--radius': '16',
  // --- GREENCARD BRAND COLORS ---
  '--background': '10 10 10', // Exact #0A0A0A
  '--foreground': '255 255 255', // Pure White
  '--card': '18 18 18',
  '--card-foreground': '255 255 255',

  '--primary': '15 118 110', // Exact #0F766E Teal
  '--primary-foreground': '255 255 255',

  '--secondary': '223 244 241', // #DFF4F1 Glow
  '--secondary-foreground': '15 118 110',

  '--muted': '23 23 23',
  '--muted-foreground': '161 161 170',
  '--border': '38 38 38',
  '--input': '23 23 23',
  '--ring': '15 118 110',
});
