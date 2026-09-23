import { Blocks } from 'lucide-react'
import { useState } from 'react'
import { Tabs } from '@heroui/react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { MemoryTab } from './MemoryTab'
import { SessionsTab } from './SessionsTab'

export function IntegrationsPage(): React.JSX.Element {
  const [tab, setTab] = useState('memory')

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:pt-16">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-1">
            <Blocks size={13} aria-hidden="true" /> Provider integrations
          </span>
        }
        title="Integrations"
        description="One memory that knows you — captured sessions and shared context across every provider."
      />

      <Tabs className="mt-6" selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Integration sections">
            <Tabs.Tab id="memory">
              Memory
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sessions">
              Sessions
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="memory" className="pt-6">
          <MemoryTab />
        </Tabs.Panel>
        <Tabs.Panel id="sessions" className="pt-6">
          <SessionsTab />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
