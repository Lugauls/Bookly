import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  professionalAccountSelect,
  type AuthenticatedProfessional,
} from '../professionals/professional.select.js';
import type { JwtPayload } from './auth.types.js';
import type { AuthResponseDto } from './dto/auth-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.professional.findFirst({
      where: { OR: [{ email }, { slug }] },
      select: { email: true, slug: true },
    });

    if (existing?.email === email) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    if (existing?.slug === slug) {
      throw new ConflictException('Este slug já está em uso.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    let professional: AuthenticatedProfessional;

    try {
      professional = await this.prisma.professional.create({
        data: {
          name: dto.name.trim(),
          businessName: dto.businessName?.trim(),
          email,
          passwordHash,
          phone: dto.phone.replace(/\D/g, ''),
          slug,
          bio: dto.bio?.trim(),
          timezone: dto.timezone?.trim() ?? 'America/Manaus',
        },
        select: professionalAccountSelect,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email ou slug já está em uso.');
      }

      throw error;
    }

    return this.createAuthResponse(professional);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const professionalWithPassword =
      await this.prisma.professional.findUnique({
        where: { email },
        select: { ...professionalAccountSelect, passwordHash: true },
      });

    if (!professionalWithPassword) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    let passwordMatches = false;

    try {
      passwordMatches = await argon2.verify(
        professionalWithPassword.passwordHash,
        dto.password,
      );
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const { passwordHash: _passwordHash, ...professional } =
      professionalWithPassword;

    return this.createAuthResponse(professional);
  }

  private async createAuthResponse(
    professional: AuthenticatedProfessional,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: professional.id,
      email: professional.email,
      type: 'access',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      professional,
      tokenType: 'Bearer',
    };
  }
}
