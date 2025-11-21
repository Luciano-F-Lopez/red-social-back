import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  private generarToken(usuario: any) {
    return this.jwtService.sign({
      sub: usuario._id,
      perfil: usuario.perfil,
    });
  }

  async register(data: any): Promise<any> {
    try {
      const nuevoUsuario = await this.usuariosService.crearUsuario(data);

      const { password, ...usuarioLimpio } = nuevoUsuario.toObject();

      return {
        token: this.generarToken(nuevoUsuario),
        usuario: usuarioLimpio,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(correoOrUsername: string, password: string): Promise<any> {
    const usuario = await this.usuariosService.buscarUsuarioParaLogin(correoOrUsername);
    console.log('Usuario encontrado raw:', usuario)
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const usuarioLimpio = usuario.toObject();
    delete usuarioLimpio.password;

    return {
      token: this.generarToken(usuario),
      usuario: usuarioLimpio,
    };
  }

  async autorizar(token: string) {
    try {
      const datos = this.jwtService.verify(token);
      return this.usuariosService.obtenerUsuarioPorId(datos.sub);
    } catch (e) {
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }

  async refrescar(token: string) {
    try {
      const datos = this.jwtService.verify(token);

      const usuario = await this.usuariosService.obtenerUsuarioPorId(datos.sub);
      if (!usuario) throw new UnauthorizedException();

      return {
        token: this.generarToken(usuario),
      };
    } catch (e) {
      throw new UnauthorizedException('No se pudo refrescar el token');
    }
  }
}

