export declare enum Role {
    DOCTOR = "DOCTOR",
    PATIENT = "PATIENT"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
