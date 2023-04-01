import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  signup() {
    return { msg: 'Sign up service' };
  }

  signin() {
    return { msg: 'Sign in service' };
  }
}
