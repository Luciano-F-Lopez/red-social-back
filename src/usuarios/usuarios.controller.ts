import { Controller, Get, Param, NotFoundException, Post, Body, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsuariosService } from './usuarios.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CloudinaryService } from '../config/cloudinary.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Get()
  async obtenerUsuarios() {
    return this.usuariosService.obtenerUsuarios();
  }

  @Get(':id')
  async obtenerUsuarioPorId(@Param('id') id: string) {
    const usuario = await this.usuariosService.obtenerUsuarioPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  // Solo admin puede crear usuarios
  @UseGuards(AdminGuard)
  @Post()
  @UseInterceptors(FileInterceptor('imagenPerfil', { storage: memoryStorage() }))
  async crearUsuario(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    try {
      // Si viene archivo, subirlo a Cloudinary
      if (file) {
        const upload = await this.cloudinaryService.uploadImage(file);
        body.imagenPerfil = upload.secure_url;
      }

      // Garantizar que si no es admin, el perfil sea 'usuario'
      if (!body.perfil || body.perfil !== 'admin') {
        body.perfil = 'usuario';
      }

      return await this.usuariosService.crearUsuario(body);
    } catch (error) {
      throw new BadRequestException(`Error al crear usuario: ${error.message}`);
    }
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async deshabilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.deshabilitarUsuario(id);
  }

  @UseGuards(AdminGuard)
  @Post('habilitar/:id')
  async habilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.habilitarUsuario(id);
  }
}






