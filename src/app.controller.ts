import {
  BadRequestException,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';

export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('video')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'video',
          maxCount: 1,
        },
        {
          name: 'thumbnail',
          maxCount: 1,
        },
      ],
      {
        dest: './uploads',
        storage: diskStorage({
          destination: './uploads',
          filename: (
            _req: any,
            file: { originalname: string },
            cb: (arg0: null, arg1: string) => void,
          ) => {
            cb(
              null,
              `${Date.now()}-${randomUUID()}${extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.mimetype !== 'video/mp4' && file.mimetype !== 'image/jpeg') {
            cb(
              new BadRequestException(
                'Invalid file type. Only video/mp4 and image/jpeg are supported',
              ),
              false,
            );
          } else {
            cb(null, true);
          }
        },
      },
    ),
  )
  async uploadVideo(
    @Req() _req: Request,
    @Body()
    contentData: { title: string; description: string },
    @UploadedFiles()
    files: { video: Express.Multer.File[]; thumbnail: Express.Multer.File[] },
  ): Promise<{ message: string }> {
    const videoFile = files?.video[0];
    const thumbnailFile = files?.thumbnail[0];

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException(
        'Both video and thumbnail files are required',
      );
    }

    await this.prismaService.video.create({
      data: {
        title: contentData.title,
        description: contentData.description,
        url: videoFile.path,
        thumbnailUrl: thumbnailFile.path,
        sizeInKb: Math.round(videoFile.size / 1024),
        duration: 0,
      },
    });

    return {
      message: 'Video uploaded successfully',
    };
  }
}
