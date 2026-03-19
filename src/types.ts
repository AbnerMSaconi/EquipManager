export interface User {
  id: string;
  email?: string;
  rf?: string;
  username?: string;
  role: 'admin' | 'user';
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  category?: string;
  room?: string;
  cabinet?: string;
  shelf?: string;
  imageUrl?: string;
}

export interface Log {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userEmail: string;
  userIdentifier?: string;
  actionType: 'retirada' | 'recebimento';
  quantity: number;
  destination?: string;
  timestamp: any; // Firestore Timestamp
  returnDeadline?: any; // Firestore Timestamp
  status?: 'completed' | 'active' | 'returned';
  returnDate?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
