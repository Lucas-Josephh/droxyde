import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  index() {
    return {
      name: 'Droxyde API',
      health: '/api/health',
      auth: '/api/auth',
    };
  }
}
