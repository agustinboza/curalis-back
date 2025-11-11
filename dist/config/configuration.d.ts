declare const _default: () => {
    nodeEnv: string;
    port: number;
    fhir: {
        provider: string;
        baseUrl: string;
    };
    auth: {
        provider: string;
        jwtSecret: string;
        cognito: {
            region: string;
            userPoolId: string;
            audience: string;
        };
    };
    aws: {
        region: string;
        s3Bucket: string;
    };
};
export default _default;
