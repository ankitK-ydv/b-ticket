import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  getStatus(): object {
    return{
      project: 'Private Bus Digital Ticekting platform',
      status: 'BAckend is running',
    };
  }




  
}
