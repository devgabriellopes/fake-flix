import {
  BadRequestException,
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

export class AppController {
  @Get()
  async getHello(): Promise<string> {
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
    @UploadedFiles()
    files: { video: Express.Multer.File[]; thumbnail: Express.Multer.File[] },
  ): Promise<{ message: string }> {
    console.log(files);
    return {
      message: 'Video uploaded successfully',
    };
  }
}
