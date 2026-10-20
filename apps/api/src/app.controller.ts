import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  service: string;
  status: 'ok';
  timestamp: string;
};

@ApiTags('health')
@Controller('health')
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Verifica se a API está em execução' })
  @ApiOkResponse({
    schema: {
      example: {
        service: 'bookly-api',
        status: 'ok',
        timestamp: '2026-10-19T12:00:00.000Z',
      },
    },
  })
  getHealth(): HealthResponse {
    return {
      service: 'bookly-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
