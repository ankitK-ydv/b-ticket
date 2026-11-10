import { Test, TestingModule } from '@nestjs/testing';
import { RouteDirectionsController } from './route-directions.controller.js';

describe('RouteDirectionsController', () => {
  let controller: RouteDirectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RouteDirectionsController],
    }).compile();

    controller = module.get<RouteDirectionsController>(RouteDirectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
