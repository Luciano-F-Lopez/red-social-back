import { Controller, Post, Body, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';

@Controller('auth') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `perfil-${uniqueSuffix}${ext}`);
      }
    })
  }))
  async registro(@Body() body: any, @UploadedFile() file: any) {
    try {
      if (file) {
        body.imagenPerfil = `uploads/${file.filename}`; 
      }
      return await this.authService.register(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    const correoOrUsername = body.correoOrUsername;
    const password = body.password || body.contrasena;

    if (!correoOrUsername || !password) {
      throw new BadRequestException('Faltan campos obligatorios');
    }

    try {
      return await this.authService.login(correoOrUsername, password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
