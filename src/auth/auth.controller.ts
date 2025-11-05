import { Controller, Post, Body, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
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
  @UseInterceptors(FileInterceptor('imagenPerfil', {
    storage: memoryStorage(), 
  }))
  async registro(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    try {
        let imageUrl: string | null = null;
        
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            imageUrl = uploadResult.secure_url;
            body.imagenPerfil = imageUrl; 
        } else {
             body.imagenPerfil = null; 
        }

      
      return await this.authService.register(body);

    } catch (error) {
      console.error('Error durante el registro o subida a Cloudinary:', error);
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

    try {
      return await this.authService.login(correoOrUsername, password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
