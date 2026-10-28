const getRequiredString = (
  environment: Record<string, unknown>,
  name: string,
): string => {
  const value = environment[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} deve ser configurada.`);
  }

  return value.trim();
};

export const validateEnvironment = (
  environment: Record<string, unknown>,
): Record<string, unknown> => {
  const databaseUrl = getRequiredString(environment, 'DATABASE_URL');
  const jwtSecret = getRequiredString(environment, 'JWT_SECRET');
  const jwtExpiresIn = getRequiredString(environment, 'JWT_EXPIRES_IN');
  const apiPort = Number(environment.API_PORT ?? 3000);

  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 bytes.');
  }

  if (!/^[1-9]\d*[smhd]$/.test(jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN deve usar o formato 15m, 1h ou 7d.');
  }

  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65_535) {
    throw new Error('API_PORT deve ser uma porta válida.');
  }

  return {
    ...environment,
    API_PORT: apiPort,
    DATABASE_URL: databaseUrl,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_SECRET: jwtSecret,
  };
};
