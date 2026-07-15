// Centralise all config reads here so the rest of the app never calls process.env directly
export default () => ({
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  app: {
    frontendUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
  email: {
    from: process.env.EMAIL_FROM ?? 'noreply@yoursaas.com',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
