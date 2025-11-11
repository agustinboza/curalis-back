export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  fhir: {
    provider: process.env.FHIR_PROVIDER ?? 'hapi',
    baseUrl: process.env.FHIR_BASE_URL ?? 'http://localhost:8080/fhir',
  },
  auth: {
    provider: process.env.AUTH_PROVIDER ?? 'jwt',
    jwtSecret: process.env.JWT_SECRET ?? 'changeme',
    cognito: {
      region: process.env.COGNITO_REGION ?? '',
      userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
      audience: process.env.COGNITO_AUDIENCE ?? '',
    },
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    s3Bucket: process.env.S3_BUCKET ?? '',
  },
});



