import { Controller, Post, Body, BadRequestException, UseInterceptors, UploadedFile, Headers, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../config/cloudinary.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', { storage: memoryStorage() }))
  async registro(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    try {
      if (file) {
        const upload = await this.cloudinaryService.uploadImage(file);
        body.imagenPerfil = upload.secure_url;
      }

      return await this.authService.register(body);

    } catch (error) {
      throw new BadRequestException(`Error al registrar usuario: ${error.message}`);
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    const correoOrUsername = body.correoOrUsername;
    const password = body.password || body.contrasena;

    if (!correoOrUsername || !password) {
      throw new BadRequestException('Faltan campos obligatorios');
    }

    return await this.authService.login(correoOrUsername, password);
  }

  @Post('autorizar')
  autorizar(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No enviaste token');
    return this.authService.autorizar(token);
  }

  @Post('refrescar')
  refrescar(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No enviaste token');
    return this.authService.refrescar(token);
  }
}

