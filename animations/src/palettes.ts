// Light and dark color palettes. `accent` matches BojiTheme.accent in each app.

const light = {
  skin: '#EDBF9E', skinFar: '#D9A483', skinShade: '#D69D7A', hair: '#2E2622', eye: '#2E2622',
  shirt: '#2F6B57', shirtFar: '#24533F', shorts: '#2F323B', shortsFar: '#23252C', band: '#3B3F4A',
  shoe: '#F4F0E8', shoeFar: '#DCD5C9', sole: '#B9B0A2', accent: '#C7401F',
  shadow: '#1F1A14', shadowOpacity: 9,
  prop: '#DDD7CD', propDark: '#C3BBAE', propLight: '#ECE7DF', pad: '#4A4E57', padFar: '#3C4048',
  mat: '#E7DED1', matEdge: '#D5C9B9', metal: '#9DA3AB', metalDark: '#7F858E', cable: '#5B6068', plate: '#3E424A',
};

/**
 * Hex colors, plus `shadowOpacity` in percent. The shadow is translucent, so it adapts to the card color.
 * Both palettes give the floor shadow about 1.20:1 contrast: light on #FFFFFF, dark on #222220.
 */
export type Palette = typeof light;
export type PaletteName = 'light' | 'dark';

export const PALETTES: Record<PaletteName, Palette> = {
  light,
  dark: {
    skin: '#E9B994', skinFar: '#C69071', skinShade: '#C88E6C', hair: '#5B473C', eye: '#2E2622',
    shirt: '#3F9176', shirtFar: '#2F6E59', shorts: '#5B6171', shortsFar: '#474C5A', band: '#6A7182',
    shoe: '#EEE9E0', shoeFar: '#C8C1B5', sole: '#9D9589', accent: '#FF7A4D',
    shadow: '#000000', shadowOpacity: 55,
    prop: '#3E3E42', propDark: '#2F2F33', propLight: '#4B4B50', pad: '#5E6370', padFar: '#4C505B',
    mat: '#2E2D30', matEdge: '#3B3A3E', metal: '#7E848D', metalDark: '#666B73', cable: '#A4AAB2', plate: '#3A3D44',
  },
};
