import { Test, TestingModule } from '@nestjs/testing';
import { RouteDirectionsService } from './route-directions.service.js';

describe('RouteDirectionsService', () => {
  let service: RouteDirectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouteDirectionsService],
    }).compile();

    service = module.get<RouteDirectionsService>(RouteDirectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
