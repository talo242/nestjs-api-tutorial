import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signup() {
    return { msg: 'Sign up service' };
  }

  signin() {
    return { msg: 'Sign in service' };
  }
}
