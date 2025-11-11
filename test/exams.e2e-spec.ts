import { Test, TestingModule } from '@nestjs/testing';
import { ExamsModule } from '../src/exams/exams.module';
import { FhirService } from '../src/fhir/fhir.service';
import { ExamsController } from '../src/exams/exams.controller';

describe('ExamsController (basic)', () => {
  let moduleRef: TestingModule;
  let controller: ExamsController;

  beforeAll(async () => {
    const fhirStub: Partial<FhirService> = {
      search: async () => ({ entry: [] }),
      create: async (_t: any, r: any) => ({ id: '1', ...r }),
      read: async (_t: any, id: any) => ({ id }),
      update: async (_t: any, _id: any, r: any) => r,
      delete: async () => undefined,
    } as any;

    moduleRef = await Test.createTestingModule({
      imports: [ExamsModule],
    })
      .overrideProvider(FhirService)
      .useValue(fhirStub)
      .compile();

    controller = moduleRef.get(ExamsController);
  });

  it('should list exam templates', async () => {
    const res: any = await controller.listTemplates();
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });
});


