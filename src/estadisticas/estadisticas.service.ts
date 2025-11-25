import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from '../publicaciones/schemas/publicacion.schema';
import { Like } from '../publicaciones/schemas/like.schema';
import { Comentario } from '../publicaciones/schemas/comentario.schema';
import { Usuario } from '../usuarios/schemas/usuario.schema';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
    @InjectModel(Like.name) private likeModel: Model<Like>,
    @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>,
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
  ) {}

  // helper: construye filtro por rango de fechas si vienen
  private rangoFechasMatch(desde?: string, hasta?: string) {
    if (!desde && !hasta) return {};
    const match: any = {};
    if (desde) match.$gte = new Date(desde);
    if (hasta) {
      // incluir el día completo de 'hasta'
      const d = new Date(hasta);
      d.setHours(23, 59, 59, 999);
      match.$lte = d;
    }
    return { createdAt: match };
  }

  // 1) publicaciones por usuario (opcional rango fechas)
  async publicacionesPorUsuario(desde?: string, hasta?: string) {
    const fechaMatch = this.rangoFechasMatch(desde, hasta);
    const matchStage: any = { borradoLogico: false };
    if (Object.keys(fechaMatch).length) Object.assign(matchStage, fechaMatch);

    const usuariosCollection = this.usuarioModel.collection.name;

    return this.publicacionModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: usuariosCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'autor',
        },
      },
      { $unwind: '$autor' },
      { $project: { _id: 0, usuario: '$autor.username', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    ]);
  }

  // 2) cantidad de comentarios en un rango (por usuario)
  async comentariosPorUsuario(desde?: string, hasta?: string) {
    const match = this.rangoFechasMatch(desde, hasta);
    const usuariosCollection = this.usuarioModel.collection.name;

    const pipeline: any[] = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    pipeline.push(
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: usuariosCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: '$usuario' },
      { $project: { _id: 0, usuario: '$usuario.username', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    );

    return this.comentarioModel.aggregate(pipeline);
  }

  
  // 3) comentarios por publicación en un rango
  async comentariosPorPublicacion(desde?: string, hasta?: string) {
    const match = this.rangoFechasMatch(desde, hasta);
    const publicacionesCollection = this.publicacionModel.collection.name;

    const pipeline: any[] = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    pipeline.push(
      // Agrupamos comentarios por publicación
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },

      // Traemos los datos de la publicación
      {
        $lookup: {
          from: publicacionesCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },

      // ← FILTRAMOS SOLO PUBLICACIONES NO BORRADAS
      { $match: { 'publicacion.borradoLogico': false } },

      // Seleccionamos los campos que nos interesan
      { $project: { _id: 0, publicacionId: '$_id', titulo: '$publicacion.titulo', cantidad: 1 } },

      { $sort: { cantidad: -1 } },
    );
    return this.comentarioModel.aggregate(pipeline);
  }
}

