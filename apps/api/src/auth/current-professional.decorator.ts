import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedProfessional } from '../professionals/professional.select.js';

type RequestWithProfessional = {
  user: AuthenticatedProfessional;
};

export const CurrentProfessional = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedProfessional =>
    context.switchToHttp().getRequest<RequestWithProfessional>().user,
);
