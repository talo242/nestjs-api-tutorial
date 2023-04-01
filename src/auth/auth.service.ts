import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    // Hash the password
    const hash = await argon.hash(dto.password);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    const { hash: _, ...userWithoutHash } = user;

    return userWithoutHash;
  }

  signin() {
    return { msg: 'Sign in service' };
  }
}
