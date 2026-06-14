import type { Preview } from 'storybook-solidjs-vite'
import '../src/styles/index.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'zinc',
      values: [{ name: 'zinc', value: '#09090b' }]
    }
  }
}

export default preview
