export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  specialties: string[];
  userId: number;
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}
