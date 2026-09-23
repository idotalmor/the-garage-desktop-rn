export const IntegrationChannel = {
  MemoryGet: 'integrations:memory-get',
  MemorySave: 'integrations:memory-save',
  MemorySync: 'integrations:memory-sync',
  MemoryChat: 'integrations:memory-chat',
  ProvidersList: 'integrations:providers-list',
  ProviderSetInstalled: 'integrations:provider-set-installed',
  SessionsList: 'integrations:sessions-list',
  SessionGet: 'integrations:session-get',
  SessionsChanged: 'integrations:sessions-changed',
  MemoryChanged: 'integrations:memory-changed',
  HasApiKey: 'integrations:has-api-key',
  SetApiKey: 'integrations:set-api-key'
} as const
