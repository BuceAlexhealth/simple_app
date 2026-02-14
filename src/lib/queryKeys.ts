export const queryKeys = {
  user: ['user'] as const,
  session: ['session'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  
  orders: (userId: string | undefined, role?: string, searchQuery?: string, dateFrom?: string, dateTo?: string) => 
    ['orders', userId, role, searchQuery, dateFrom, dateTo] as const,
  
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
  
  lowStockItems: (pharmacyId: string | undefined) => 
    ['lowStockItems', pharmacyId] as const,
  
  criticalStockItems: (pharmacyId: string | undefined) => 
    ['criticalStockItems', pharmacyId] as const,
  
  outOfStockItems: (pharmacyId: string | undefined) => 
    ['outOfStockItems', pharmacyId] as const,
  
  expiringBatches: (pharmacyId: string | undefined) => 
    ['expiringBatches', pharmacyId] as const,
  
  orderFulfillments: (orderId: string | undefined) => 
    ['orderFulfillments', orderId] as const,
} as const;

export type QueryKey = typeof queryKeys;
