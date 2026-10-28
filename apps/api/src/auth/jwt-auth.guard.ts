import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  professionalAccountSelect,
  type AuthenticatedProfessional,
} from '../professionals/professional.select.js';
import type { JwtPayload } from './auth.types.js';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedProfessional;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    if (
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0 ||
      payload.type !== 'access'
    ) {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    const professional = await this.prisma.professional.findUnique({
      where: { id: payload.sub },
      select: professionalAccountSelect,
    });

    if (!professional) {
      throw new UnauthorizedException('Conta não encontrada.');
    }

    request.user = professional;
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const [scheme, token, ...extraParts] =
      request.headers.authorization?.trim().split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
      return undefined;
    }

    return token;
  }
}
