import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { FhirService } from '../src/fhir/fhir.service';
import { AppointmentsController } from '../src/appointments/appointments.controller';

describe('AppointmentsController (basic)', () => {
  let moduleRef: TestingModule;
  let controller: AppointmentsController;

  beforeAll(async () => {
    const fhirStub: Partial<FhirService> = {
      search: async () => ({ entry: [] }),
      create: async (_t: any, r: any) => ({ id: '1', ...r }),
      read: async (_t: any, id: any) => ({ id }),
      update: async (_t: any, _id: any, r: any) => r,
      delete: async () => undefined,
    } as any;

    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule],
    })
      .overrideProvider(FhirService)
      .useValue(fhirStub)
      .compile();

    controller = moduleRef.get(AppointmentsController);
  });

  it('should get availability', async () => {
    const res: any = await controller.getAvailability('doc-1', '2025-01-01', '30');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });
});


