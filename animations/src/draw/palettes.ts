// Light and dark color palettes. `accent` matches BojiTheme.accent in each app.

const light = {
  skin: '#EDBF9E', skinFar: '#D9A483', skinShade: '#D69D7A', hair: '#2E2622', eye: '#2E2622',
  hairShine: '#4A3D36', eyeShine: '#FFFFFF', mouth: '#8A4B3A', blush: '#F08F7A', blushOpacity: 45,
  shirt: '#2F6B57', shirtFar: '#24533F', shorts: '#2F323B', shortsFar: '#23252C', band: '#3B3F4A',
  shirtTrim: '#F2EDE3', shirtTrimFar: '#D6D0C4', stripe: '#F2EDE3',
  sock: '#FAF8F4', sockFar: '#E2DDD3', shoeAccent: '#2F6B57', shoeAccentFar: '#24533F',
  shoe: '#F4F0E8', shoeFar: '#DCD5C9', sole: '#B9B0A2', accent: '#C7401F',
  shadow: '#1F1A14', shadowOpacity: 9,
  prop: '#DDD7CD', propDark: '#C3BBAE', propLight: '#ECE7DF', pad: '#4A4E57', padFar: '#3C4048',
  mat: '#E7DED1', matEdge: '#D5C9B9', metal: '#9DA3AB', metalDark: '#7F858E', cable: '#5B6068', plate: '#3E424A',
  ball: '#8FB3C9', ballShine: '#B8D0DE', medBall: '#575D68', medBallSeam: '#353940',
  resistBand: '#D9824B', roller: '#3F5A6B', rollerFace: '#5D7A8C',
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
    hairShine: '#7A6252', eyeShine: '#FFFFFF', mouth: '#7A4032', blush: '#E8826C', blushOpacity: 40,
    shirt: '#3F9176', shirtFar: '#2F6E59', shorts: '#5B6171', shortsFar: '#474C5A', band: '#6A7182',
    shirtTrim: '#E8E2D6', shirtTrimFar: '#B9B3A8', stripe: '#D9D3C7',
    sock: '#EEE9E0', sockFar: '#C8C1B5', shoeAccent: '#3F9176', shoeAccentFar: '#2F6E59',
    shoe: '#EEE9E0', shoeFar: '#C8C1B5', sole: '#9D9589', accent: '#FF7A4D',
    shadow: '#000000', shadowOpacity: 55,
    prop: '#3E3E42', propDark: '#2F2F33', propLight: '#4B4B50', pad: '#5E6370', padFar: '#4C505B',
    mat: '#2E2D30', matEdge: '#3B3A3E', metal: '#7E848D', metalDark: '#666B73', cable: '#A4AAB2', plate: '#3A3D44',
    ball: '#5F8297', ballShine: '#82A2B5', medBall: '#5E6470', medBallSeam: '#3B3F47',
    resistBand: '#E39360', roller: '#4F6E80', rollerFace: '#6F8E9F',
  },
};
