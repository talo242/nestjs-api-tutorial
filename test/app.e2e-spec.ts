import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { like } from 'pactum-matchers';
import * as pactum from 'pactum';

import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

    await app.init();
    await app.listen(3333);

    prismaService = app.get(PrismaService);

    await prismaService.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@testerson.com',
      password: 'password',
    };

    describe('Sign up', () => {
      it('should create a new user', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });

      it('should throw an error if email is empty', () => {
        const { email: _, ...dtoWithoutEmail } = dto;
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dtoWithoutEmail)
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        const { password: _, ...dtoWithoutPassword } = dto;
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dtoWithoutPassword)
          .expectStatus(400);
      });

      it('should throw an error if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
    });

    describe('Sign in', () => {
      it('should sign in users', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200);
      });

      it('should return a token', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .expectJsonMatch({
            access_token: like(''),
          })
          .stores('userAt', 'access_token');
      });

      it('should throw an error if email is empty', () => {
        const { email: _, ...dtoWithoutEmail } = dto;
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dtoWithoutEmail)
          .expectStatus(400);
      });

      it('should throw an error if password is empty', () => {
        const { password: _, ...dtoWithoutPassword } = dto;
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dtoWithoutPassword)
          .expectStatus(400);
      });

      it('should throw an error if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get the current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('should edit a user', () => {
        const dto: EditUserDto = {
          firstName: 'Test',
          lastName: 'Testerson',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });

    describe('Bookmarks', () => {
      describe('Get bookmarks', () => {});

      describe('Create bookmarks', () => {});

      describe('Get bookmark by id', () => {});

      describe('Edit bookmark by id', () => {});

      describe('Delete bookmark by id', () => {});
    });
  });
});
