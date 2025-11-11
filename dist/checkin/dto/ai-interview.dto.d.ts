export declare class AiInterviewDto {
    patientId: string;
    appointmentId?: string;
    questionnaireId?: string;
    items: Array<{
        linkId: string;
        text?: string;
        answer?: Array<{
            valueString?: string;
            valueBoolean?: boolean;
            valueNumber?: number;
        }>;
    }>;
}
