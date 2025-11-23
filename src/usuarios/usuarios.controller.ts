import { Controller, Get, Param, NotFoundException,Post,Body,Delete,UseGuards  } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(AdminGuard)
  @Get()
  async obtenerUsuarios() {
    return this.usuariosService.obtenerUsuarios();
  }

  // Solo admin puede ver usuario por ID
  @UseGuards(AdminGuard)
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
  async crearUsuario(@Body() data: any) {
    return this.usuariosService.crearUsuario(data);
  }

  // Sprint pide DELETE para deshabilitar usuario
  @UseGuards(AdminGuard)
  @Delete(':id')
  async deshabilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.deshabilitarUsuario(id);
  }

  // Sprint pide POST para habilitar (alta lógica)
  @UseGuards(AdminGuard)
  @Post('habilitar/:id')
  async habilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.habilitarUsuario(id);
  }
}





