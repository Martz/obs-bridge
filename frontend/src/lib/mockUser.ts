export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'moderator'
  joinedDate: Date
}

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  role: 'admin',
  joinedDate: new Date('2024-01-15'),
}

// Additional mock users for future features
export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    role: 'user',
    joinedDate: new Date('2024-03-20'),
  },
  {
    id: 'user-3',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'moderator',
    joinedDate: new Date('2024-02-10'),
  },
]
