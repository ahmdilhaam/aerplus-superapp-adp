import type { User } from '../types'

export const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'SUPER_ADMIN', status: 'Active', avatar: 'JD', joinDate: '2024-01-15', outlets: ['outlet-001', 'outlet-002'] },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'COMPANY_ADMIN', status: 'Active', avatar: 'JS', joinDate: '2024-02-20', outlets: ['outlet-001'] },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'OPERATION_MANAGER', status: 'Active', avatar: 'MJ', joinDate: '2024-03-10', outlets: ['outlet-002', 'outlet-003'] },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'AREA_MANAGER', status: 'Inactive', avatar: 'SW', joinDate: '2024-04-05', outlets: ['outlet-003'] },
  { id: '5', name: 'Tom Brown', email: 'tom@example.com', role: 'AREA_SUPERVISOR', status: 'Active', avatar: 'TB', joinDate: '2024-05-12', outlets: ['outlet-001', 'outlet-004'] },
  { id: '6', name: 'Emily Davis', email: 'emily@example.com', role: 'SUPERVISOR', status: 'Active', avatar: 'ED', joinDate: '2024-06-18', outlets: ['outlet-002'] },
  { id: '7', name: 'Robert Miller', email: 'robert@example.com', role: 'OUTLET_ADMIN', status: 'Pending', avatar: 'RM', joinDate: '2024-07-22', outlets: ['outlet-003'] },
  { id: '8', name: 'Lisa Anderson', email: 'lisa@example.com', role: 'HOFO', status: 'Active', avatar: 'LA', joinDate: '2024-08-14', outlets: ['outlet-004', 'outlet-005'] },
  { id: '9', name: 'Chris Taylor', email: 'chris@example.com', role: 'STAFF', status: 'Active', avatar: 'CT', joinDate: '2024-09-08', outlets: ['outlet-001'] },
  { id: '10', name: 'Jennifer Martin', email: 'jennifer@example.com', role: 'STAFF', status: 'Active', avatar: 'JM', joinDate: '2024-10-03', outlets: ['outlet-002', 'outlet-003'] },
  { id: '11', name: 'David Lee', email: 'david@example.com', role: 'COMPANY_ADMIN', status: 'Active', avatar: 'DL', joinDate: '2024-11-11', outlets: ['outlet-001'] },
  { id: '12', name: 'Amanda White', email: 'amanda@example.com', role: 'STAFF', status: 'Inactive', avatar: 'AW', joinDate: '2024-12-01', outlets: ['outlet-004'] },
  { id: '13', name: 'Steven Harris', email: 'steven@example.com', role: 'OPERATION_MANAGER', status: 'Active', avatar: 'SH', joinDate: '2024-01-25', outlets: ['outlet-005', 'outlet-006'] },
  { id: '14', name: 'Rebecca Clark', email: 'rebecca@example.com', role: 'STAFF', status: 'Active', avatar: 'RC', joinDate: '2024-02-14', outlets: ['outlet-002'] },
  { id: '15', name: 'Daniel Rodriguez', email: 'daniel@example.com', role: 'AREA_MANAGER', status: 'Pending', avatar: 'DR', joinDate: '2024-03-20', outlets: ['outlet-006'] },
  { id: '16', name: 'Karen Lewis', email: 'karen@example.com', role: 'AREA_SUPERVISOR', status: 'Active', avatar: 'KL', joinDate: '2024-04-15', outlets: ['outlet-003', 'outlet-007'] },
  { id: '17', name: 'Paul Walker', email: 'paul@example.com', role: 'STAFF', status: 'Active', avatar: 'PW', joinDate: '2024-05-22', outlets: ['outlet-001'] },
  { id: '18', name: 'Nancy Hall', email: 'nancy@example.com', role: 'OUTLET_ADMIN', status: 'Active', avatar: 'NH', joinDate: '2024-06-08', outlets: ['outlet-007'] },
  { id: '19', name: 'Matthew Young', email: 'matthew@example.com', role: 'SUPERVISOR', status: 'Inactive', avatar: 'MY', joinDate: '2024-07-30', outlets: ['outlet-005'] },
  { id: '20', name: 'Sandra King', email: 'sandra@example.com', role: 'SUPER_ADMIN', status: 'Active', avatar: 'SK', joinDate: '2024-08-19', outlets: ['outlet-001', 'outlet-002', 'outlet-003', 'outlet-004'] },
]
