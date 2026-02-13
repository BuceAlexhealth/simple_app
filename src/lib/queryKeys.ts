export const queryKeys = {
  user: ['user'] as const,
  session: ['session'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  
  orders: (userId: string | undefined, role?: string) => 
    ['orders', userId, role] as const,
  
  batches: (inventoryId: string | undefined) => 
    ['batches', inventoryId] as const,
  
  expiredBatches: (pharmacyId: string | undefined) => 
    ['expiredBatches', pharmacyId] as const,
  
  batchMovements: (batchId: string | undefined) => 
    ['batchMovements', batchId] as const,
  
  inventory: (userId: string | undefined) => 
    ['inventory', userId] as const,
  
  pharmacies: (userId: string | undefined) => 
    ['pharmacies', userId] as const,
  
  chatConnections: (userId: string | undefined) => 
    ['chatConnections', userId] as const,
  
  messages: (connectionId: string | undefined) => 
    ['messages', connectionId] as const,
  
  patientMedications: (patientId: string | undefined) => 
    ['patientMedications', patientId] as const,
  
  inviteLink: (pharmacyId: string | undefined) => 
    ['inviteLink', pharmacyId] as const,
  
  realtimeAnalytics: (pharmacyId: string | undefined) => 
    ['realtimeAnalytics', pharmacyId] as const,
} as const;

export type QueryKey = typeof queryKeys;
