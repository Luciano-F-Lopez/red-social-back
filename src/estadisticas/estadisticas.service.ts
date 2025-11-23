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
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: publicacionesCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },
      { $project: { _id: 0, publicacionId: '$_id', titulo: '$publicacion.titulo', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    );

    return this.comentarioModel.aggregate(pipeline);
  }

  // 4) publicaciones por dia (rango opcional)
  async publicacionesPorDia(desde?: string, hasta?: string) {
    const matchStage: any = { borradoLogico: false };
    const fechaMatch = this.rangoFechasMatch(desde, hasta);
    if (Object.keys(fechaMatch).length) Object.assign(matchStage, fechaMatch);

    return this.publicacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, dia: '$_id', cantidad: 1 } },
    ]);
  }

  // 5) ranking/top publicaciones por likes
  async rankingPublicaciones(limit = 10) {
    return this.publicacionModel
      .find({ borradoLogico: false })
      .sort({ cantidadLikes: -1 })
      .limit(limit)
      .select('titulo cantidadLikes')
      .lean();
  }

  // 6) likes por usuario (total)
  async likesPorUsuario() {
    const usuariosCollection = this.usuarioModel.collection.name;
    return this.likeModel.aggregate([
      { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
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
    ]);
  }

  // 7) publicaciones con imagen / sin imagen
  async publicacionesConImagen() {
    return this.publicacionModel.aggregate([
      {
        $group: {
          _id: { tieneImagen: { $cond: [{ $ifNull: ['$urlImagen', false] }, true, false] } },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, tieneImagen: '$_id.tieneImagen', cantidad: 1 } },
    ]);
  }

  // 8) publicaciones por mes (últimos N meses, default 12)
  async publicacionesPorMes(meses = 12) {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - (meses - 1));
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);

    return this.publicacionModel.aggregate([
      { $match: { borradoLogico: false, createdAt: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, mes: '$_id', cantidad: 1 } },
    ]);
  }

  // 9) likes por mes (últimos N meses)
  async likesPorMes(meses = 12) {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - (meses - 1));
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);

    return this.likeModel.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          likes: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, mes: '$_id', likes: 1 } },
    ]);
  }

  // 10) comentarios por mes
  async comentariosPorMes(meses = 12) {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - (meses - 1));
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);

    return this.comentarioModel.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          comentarios: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, mes: '$_id', comentarios: 1 } },
    ]);
  }
}

