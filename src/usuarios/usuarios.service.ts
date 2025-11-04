import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from './schemas/usuario.schema';

@Injectable()
export class UsuariosService {
  constructor(@InjectModel(Usuario.name) private usuarioModel: Model<Usuario>) {}

  async crearUsuario(data: any): Promise<Usuario> {
    // Si viene de FormData, extraemos los valores
    const nombre = data.get ? data.get('nombre') : data.nombre;
    const apellido = data.get ? data.get('apellido') : data.apellido;
    const correo = data.get ? data.get('correo') : data.correo;
    const username = data.get ? data.get('usuario') : data.usuario; 
    const password = data.get ? data.get('contrasena') : data.contrasena;
    const fechaNacimiento = data.get ? data.get('fechaNacimiento') : data.fechaNacimiento;
    const descripcion = data.get ? data.get('descripcion') : data.descripcion;
    const imagenPerfil = data.get ? data.get('imagenPerfil') : data.imagenPerfil;

    console.log('Datos recibidos en backend:', {
      nombre,
      apellido,
      correo,
      username,
      password,
      fechaNacimiento,
      descripcion,
      imagenPerfil,
    });

    // Validación de contraseña
    if (!this.validarPassword(password)) {
      console.log('Contraseña no válida:', password);
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
      );
    }

    // Validar correo único
    const correoExistente = await this.usuarioModel.findOne({ correo });
    if (correoExistente) {
      throw new BadRequestException('El correo ya está registrado');
    }

    // Validar username único
    const usernameExistente = await this.usuarioModel.findOne({ username });
    if (usernameExistente) {
      throw new BadRequestException('El nombre de usuario ya está registrado');
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const nuevoUsuario = new this.usuarioModel({
      nombre,
      apellido,
      correo,
      username,
      password: hash,
      fechaNacimiento,
      descripcion,
      imagenPerfil,
      perfil: 'usuario',
    });

    return nuevoUsuario.save();
  }

  private validarPassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    return this.usuarioModel.find();
  }

  async login(correoOrUsername: string, password: string): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOne({
      $or: [{ correo: correoOrUsername }, { username: correoOrUsername }],
    });

    if (!usuario) {
      throw new BadRequestException('Usuario o correo incorrecto');
    }

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      throw new BadRequestException('Contraseña incorrecta');
    }
    
    const { password: _, ...usuarioSinPassword } = usuario.toObject();

    return usuario;
  }
}


