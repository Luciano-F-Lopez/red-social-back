import { Controller, Post, Body, Get, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', {
    storage: diskStorage({
      destination: './uploads', // Carpeta donde se guardarán las imágenes
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
        body.imagenPerfil = `uploads/${file.filename}`; // Guardamos la ruta en la DB
      }
      return await this.usuariosService.crearUsuario(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(@Body() body: any) {
  const correoOrUsername = body.correoOrUsername;
  const password = body.password || body.contrasena; // <-- aceptar ambos

  if (!correoOrUsername || !password) {
    throw new BadRequestException('Faltan campos obligatorios');
  }

  try {
    return await this.usuariosService.login(correoOrUsername, password);
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}


  @Get()
  async obtenerUsuarios() {
    return this.usuariosService.obtenerUsuarios();
  }
}




