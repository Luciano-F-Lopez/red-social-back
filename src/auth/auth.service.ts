import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service'; 
import { Usuario } from '../usuarios/schemas/usuario.schema';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService, 
  ) {}

 
  async register(
    userData: any, 
  ): Promise<any> {
    try {
      const nuevoUsuario = await this.usuariosService.crearUsuario(userData);

      const { password: _, ...result } = nuevoUsuario.toObject();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(correoOrUsername: string, password: string): Promise<any> {
    const usuario = await this.usuariosService.buscarUsuarioParaLogin(correoOrUsername);
    
    if (!usuario) {
      throw new BadRequestException('Credenciales incorrectas'); 
    }

    const match = await bcrypt.compare(password, usuario.password);
    
    if (!match) {
      throw new BadRequestException('Contraseña incorrecta');
    }
    const usuarioLimpio: any = usuario.toJSON();
    delete usuarioLimpio.password; 

    return {
      user: usuarioLimpio,
    };
  }
}
