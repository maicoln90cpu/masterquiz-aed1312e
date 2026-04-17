/** Storybook preview config — applies global theme + tailwind */
import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: 'hsl(var(--background))' },
        { name: 'dark', value: 'hsl(222 47% 11%)' },
      ],
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ },
    },
  },
};

export default preview;
