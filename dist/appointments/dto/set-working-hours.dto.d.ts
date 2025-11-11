declare class WorkingHourItemDto {
    dayOfWeek: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
    startMinutes: number;
    endMinutes: number;
}
export declare class SetWorkingHoursDto {
    hours: WorkingHourItemDto[];
    doctorId?: string;
}
export {};
