import type { Meta } from '@storybook/react';
import App from './App';

export default {
  title: 'GoFish/App',
  component: App,
  parameters: {
    chromatic: { disable: true },
  },
} as Meta;

export const Main = () => <App />;