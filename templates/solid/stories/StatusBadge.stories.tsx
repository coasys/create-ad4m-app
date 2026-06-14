import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { StatusBadge } from '../src/components/StatusBadge'

const meta: Meta<typeof StatusBadge> = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = { args: { state: 'pending', detail: 'Connecting…' } }
export const Connected: Story = { args: { state: 'connected', detail: 'AD4M connected' } }
export const Errored: Story = { args: { state: 'error', detail: 'Connection failed' } }
