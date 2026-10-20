import { Test } from '@nestjs/testing';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('returns the API health status', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const response = moduleRef.get(AppController).getHealth();

    expect(response).toEqual({
      service: 'bookly-api',
      status: 'ok',
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
