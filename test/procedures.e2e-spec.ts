import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresModule } from '../src/procedures/procedures.module';
import { FhirService } from '../src/fhir/fhir.service';
import { ProceduresController } from '../src/procedures/procedures.controller';

describe('ProceduresController (basic)', () => {
  let moduleRef: TestingModule;
  let controller: ProceduresController;

  beforeAll(async () => {
    const fhirStub: Partial<FhirService> = {
      search: async () => ({ entry: [] }),
      create: async (_t: any, r: any) => ({ id: '1', ...r }),
      read: async (_t: any, id: any) => ({ id }),
      update: async (_t: any, _id: any, r: any) => r,
      delete: async () => undefined,
    } as any;

    moduleRef = await Test.createTestingModule({
      imports: [ProceduresModule],
    })
      .overrideProvider(FhirService)
      .useValue(fhirStub)
      .compile();

    controller = moduleRef.get(ProceduresController);
  });

  it('should list templates', async () => {
    const res: any = await controller.listTemplates();
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });
});


