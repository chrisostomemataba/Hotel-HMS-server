export interface Permission {
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserPayload {
  id: string;
  fullName: string;
  email: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  permissions: Permission[];
}

export interface JwtPayload {
  sub: string;  // Subject (user ID)
  username?: string;
  // Add other JWT payload properties as needed
  iat?: number;  // Issued at
  exp?: number;  // Expiration time
}
