import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { like } from 'pactum-matchers';
import * as pactum from 'pactum';

import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

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
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmarks', () => {
      it('should create a bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'NestJS Tutorial',
          link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=8s',
        };
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .expectJsonMatch({
            id: like(1),
            title: dto.title,
            link: dto.link,
          })
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      it('should edit a bookmark by id', () => {
        const dto: EditBookmarkDto = { description: 'My first NestJS API' };
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete a bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });

      it('should return an empty array after deletion', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
