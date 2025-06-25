import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import * as fs from 'fs';
import request from 'supertest';

describe('VideoController (e2e)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prismaService = module.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(async () => {
    await prismaService.video.deleteMany({});
  });

  afterAll(async () => {
    await module.close();

    fs.rmSync('./uploads', { recursive: true, force: true });
  });

  describe('POST /video', () => {
    it('uploads a video', async () => {
      const video = {
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: 'uploads/test-video.mp4',
        thumbnailUrl: 'uploads/test-thumbnail.jpg',
        sizeInKb: 1430145,
        duration: 120,
      };

      await request(app.getHttpServer())
        .post('/video')
        .attach('video', './test/test-video.mp4')
        .attach('thumbnail', './test/test-thumbnail.jpg')
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.CREATED)
        .expect((res: request.Response) => {
          expect(res.body).toEqual({
            title: video.title,
            description: video.description,
            videoUrl: expect.stringContaining('mp4'),
            thumbnailUrl: expect.stringContaining('jpg'),
            sizeInKb: video.sizeInKb,
            duration: video.duration,
          });
        });
    });
  });
});
