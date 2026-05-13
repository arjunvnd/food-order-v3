import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  auth0Domain: string;
  auth0Audience: string;
  auth0ClientId: string;
  auth0MgmtClientId: string;
  auth0MgmtClientSecret: string;
  frontendUrl: string;
  vendorInviteDevMode: boolean;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  auth0Domain: process.env.AUTH0_DOMAIN || '',
  auth0Audience: process.env.AUTH0_AUDIENCE || '',
  auth0ClientId: process.env.AUTH0_CLIENT_ID || '',
  auth0MgmtClientId: process.env.AUTH0_MGMT_CLIENT_ID || '',
  auth0MgmtClientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  vendorInviteDevMode: process.env.VENDOR_INVITE_DEV_MODE === 'true',
};

export default config;
