import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async obtenerUsuarios() {
    return this.usuariosService.obtenerUsuarios();
  }

  // Nuevo endpoint: obtener usuario por ID
  @Get(':id')
  async obtenerUsuarioPorId(@Param('id') id: string) {
    const usuario = await this.usuariosService.obtenerUsuarioPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }
}





