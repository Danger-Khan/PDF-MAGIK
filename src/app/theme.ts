import {
  createDarkTheme,
  createLightTheme,
  type BrandVariants,
} from '@fluentui/react-components';

const brandKeys = [
  '10',
  '20',
  '30',
  '40',
  '50',
  '60',
  '70',
  '80',
  '90',
  '100',
  '110',
  '120',
  '130',
  '140',
  '150',
  '160',
] as const;

function hexToHsl(hex: string): [number, number, number] {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue /= 6;
    if (hue < 0) hue += 1;
  }

  return [hue, saturation, lightness];
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSection = hue * 6;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const match = lightness - chroma / 2;
  const components =
    hueSection < 1
      ? [chroma, secondary, 0]
      : hueSection < 2
        ? [secondary, chroma, 0]
        : hueSection < 3
          ? [0, chroma, secondary]
          : hueSection < 4
            ? [0, secondary, chroma]
            : hueSection < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return `#${components
    .map((component) =>
      Math.round((component + match) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function createBrandRamp(seed: string): BrandVariants {
  const [hue, saturation, seedLightness] = hexToHsl(seed);
  const colors = brandKeys.map((_, index) => {
    const lightness =
      index <= 8
        ? 0.97 + ((seedLightness - 0.97) * index) / 8
        : seedLightness + ((0.16 - seedLightness) * (index - 8)) / 7;
    return hslToHex(hue, saturation, lightness);
  });

  return Object.fromEntries(
    brandKeys.map((key, index) => [key, colors[index]]),
  ) as BrandVariants;
}

const brandRamp = createBrandRamp('#0F766E');
const fontFamilyBase = '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif';

export const lightTheme = {
  ...createLightTheme(brandRamp),
  colorNeutralBackground1: '#F4F7F8',
  colorNeutralBackground2: '#FFFFFF',
  colorNeutralForeground1: '#17252A',
  colorNeutralForeground2: '#5D6B70',
  colorNeutralStroke1: '#D7E0E2',
  fontFamilyBase,
};

export const darkTheme = {
  ...createDarkTheme(brandRamp),
  colorNeutralBackground1: '#121D20',
  colorNeutralBackground2: '#1C2A2E',
  colorNeutralForeground1: '#EDF4F4',
  colorNeutralForeground2: '#B3C1C3',
  colorNeutralStroke1: '#3A4A4E',
  fontFamilyBase,
};
