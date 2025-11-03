import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from './schemas/publicacion.schema';
import { Usuario } from '../usuarios/schemas/usuario.schema';

@Injectable()
export class PublicacionesService {
  constructor(@InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>) {}

  async crearPublicacion(contenido: string, autorId: string, imagen?: string): Promise<Publicacion> {
    if (!contenido) {
      throw new BadRequestException('El contenido es obligatorio');
    }

    const nuevaPublicacion = new this.publicacionModel({
      contenido,
      autor: new Types.ObjectId(autorId),
      imagen,
    });

    return nuevaPublicacion.save();
  }

  async obtenerPublicaciones(): Promise<Publicacion[]> {
    return this.publicacionModel.find().populate('autor', '-password').sort({ createdAt: -1 });
  }
}

