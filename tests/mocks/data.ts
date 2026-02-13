export const mockProfiles = {
  patient: {
    id: 'patient-uuid-123',
    role: 'patient' as const,
    full_name: 'John Patient',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  pharmacist: {
    id: 'pharmacist-uuid-456',
    role: 'pharmacist' as const,
    full_name: 'Dr. Jane Pharmacist',
    email: 'jane@pharmacy.com',
    phone: '+0987654321',
  },
};

export const mockAuthUsers = {
  patient: {
    id: 'patient-uuid-123',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    user_metadata: {
      full_name: 'John Patient',
      role: 'patient',
    },
  },
  pharmacist: {
    id: 'pharmacist-uuid-456',
    email: 'jane@pharmacy.com',
    created_at: '2024-01-01T00:00:00Z',
    user_metadata: {
      full_name: 'Dr. Jane Pharmacist',
      role: 'pharmacist',
    },
  },
};

export const mockOrders = [
  {
    id: 'order-001',
    created_at: '2024-01-15T10:30:00Z',
    patient_id: 'patient-uuid-123',
    pharmacy_id: 'pharmacy-uuid-789',
    total_price: 150.00,
    status: 'placed' as const,
    initiator_type: 'patient' as const,
  },
  {
    id: 'order-002',
    created_at: '2024-01-14T09:00:00Z',
    patient_id: 'patient-uuid-123',
    pharmacy_id: 'pharmacy-uuid-789',
    total_price: 75.50,
    status: 'ready' as const,
    initiator_type: 'patient' as const,
  },
  {
    id: 'order-003',
    created_at: '2024-01-13T14:00:00Z',
    patient_id: 'patient-uuid-124',
    pharmacy_id: 'pharmacy-uuid-789',
    total_price: 200.00,
    status: 'complete' as const,
    initiator_type: 'patient' as const,
  },
];

export const mockInventoryItems = [
  {
    id: 'inv-001',
    name: 'Paracetamol',
    brand_name: 'Crocin',
    form: 'Tablet',
    price: 50,
    stock: 100,
    pharmacy_id: 'pharmacy-uuid-789',
  },
  {
    id: 'inv-002',
    name: 'Amoxicillin',
    brand_name: 'Novamox',
    form: 'Capsule',
    price: 120,
    stock: 50,
    pharmacy_id: 'pharmacy-uuid-789',
  },
];

export const mockPharmacies = [
  {
    id: 'pharmacy-uuid-789',
    full_name: 'City Pharmacy',
    address: '123 Main St',
    phone: '+1111111111',
  },
];

export const mockChatMessages = [
  {
    id: 'msg-001',
    sender_id: 'patient-uuid-123',
    receiver_id: 'pharmacist-uuid-456',
    content: 'Is Crocin available?',
    created_at: '2024-01-15T10:00:00Z',
    read: false,
  },
];
