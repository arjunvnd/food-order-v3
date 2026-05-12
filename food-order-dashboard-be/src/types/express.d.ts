// Augments Express Request with the authenticated user attached by requireRole middleware
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      auth0Sub: string;
      email: string;
      name: string | null;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR';
      mallId: string | null;
      vendorId: string | null;
    };
  }
}
