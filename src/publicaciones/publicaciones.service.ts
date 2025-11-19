import { Injectable, BadRequestException, NotFoundException,ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from '../config/cloudinary.service';
import { Publicacion } from './schemas/publicacion.schema';
import { Like } from './schemas/like.schema';
import { Usuario } from '../usuarios/schemas/usuario.schema';
import { Comentario } from './schemas/comentario.schema';

@Injectable()
export class PublicacionesService {
    constructor(
        @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>, // Modelo de publicaciones
        @InjectModel(Like.name) private likeModel: Model<Like>,                      // Modelo de likes
        @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,             // Modelo de usuarios
        @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>,    // Modelo de comentarios
        private readonly cloudinaryService: CloudinaryService,                       // Servicio para subir imágenes
    ) {}

    // 1. CREAR PUBLICACIÓN
    async crearPublicacion(
        titulo: string,
        descripcion: string,
        autorId: string,
        file?: Express.Multer.File
    ): Promise<Publicacion> {
        if (!titulo || !autorId) {
            throw new BadRequestException('Título y autor son obligatorios.');
        }

        // Subir imagen si existe
        let urlImagen: string | undefined;
        if (file) {
            try {
                const uploadResult = await this.cloudinaryService.uploadImage(file);
                urlImagen = uploadResult.secure_url;
            } catch (error) {
                throw new BadRequestException(`Error al subir la imagen: ${error.message}`);
            }
        }

        // Crear nueva publicación en DB
        const nuevaPublicacion = new this.publicacionModel({
            titulo,
            descripcion,
            autor: new Types.ObjectId(autorId),
            urlImagen,
        });

        return nuevaPublicacion.save(); // Guardar y devolver
    }

    // 2. OBTENER PUBLICACIONES
    async obtenerPublicaciones(
        limit: number = 10,
        offset: number = 0,
        orderBy: 'fecha' | 'likes' = 'fecha',
        usuarioId?: string
    ): Promise<{ publicaciones: any[], total: number }> {

        const sortCriteria: any = orderBy === 'likes' ? { cantidadLikes: -1 } : { createdAt: -1 };
        const filter: any = { borradoLogico: false };
        if (usuarioId) filter.autor = new Types.ObjectId(usuarioId);

        // Traer publicaciones y total
        const [publicaciones, total] = await Promise.all([
            this.publicacionModel
                .find(filter)
                .sort(sortCriteria)
                .skip(offset)
                .limit(limit)
                .populate('autor', 'username nombre fotoPerfil') // Traer datos del autor
                .lean(),
            this.publicacionModel.countDocuments(filter),
        ]);

        // Traer likes de cada publicación
        const pubIds = publicaciones.map(p => p._id);
        const likes = await this.likeModel
            .find({ publicacion: { $in: pubIds } })
            .select('usuario publicacion')
            .lean();

        // Mapear likes por publicación
        const likesMap: Record<string, string[]> = {};
        for (const l of likes) {
            const pubId = l.publicacion.toString();
            const userId = l.usuario.toString();
            if (!likesMap[pubId]) likesMap[pubId] = [];
            likesMap[pubId].push(userId);
        }

        // Añadir likes a las publicaciones
        const publicacionesConLikes = publicaciones.map(pub => ({
            ...pub,
            likes: likesMap[pub._id.toString()] || [],
        }));

        return { publicaciones: publicacionesConLikes, total };
    }

    // 3. ELIMINAR PUBLICACIÓN (borrado lógico)
    async eliminarPublicacion(publicacionId: string, usuarioPeticionId: string): Promise<Publicacion> {
        const publicacion = await this.publicacionModel.findById(publicacionId).exec();

        if (!publicacion || publicacion.borradoLogico) {
            throw new NotFoundException('Publicación no encontrada.');
        }

        if (publicacion.autor.toString() !== usuarioPeticionId) {
            throw new BadRequestException('No tienes permiso para eliminar esta publicación.');
        }

        publicacion.borradoLogico = true;
        return publicacion.save(); // Guardar cambio
    }

    // 4. DAR ME GUSTA
    async darMeGusta(publicacionId: string, autorId: string): Promise<any> {
        const publicacionObjId = new Types.ObjectId(publicacionId);
        const autorObjId = new Types.ObjectId(autorId);

        try {
            // Crear like en DB
            await this.likeModel.create({ publicacion: publicacionObjId, usuario: autorObjId });

            // Incrementar contador en la publicación
            const publicacionActualizada = await this.publicacionModel.findByIdAndUpdate(
                publicacionId, { $inc: { cantidadLikes: 1 } }, { new: true }
            ).exec();

            if (!publicacionActualizada) {
                await this.likeModel.deleteOne({ publicacion: publicacionObjId, usuario: autorObjId }).exec();
                throw new NotFoundException('Publicación no encontrada.');
            }

            return { mensaje: 'Me Gusta añadido.', cantidadLikes: publicacionActualizada.cantidadLikes };
        } catch (error) {
            // Evitar duplicados
            if (error.code === 11000) {
                const cantidadLikes = await this.publicacionModel.findById(publicacionId)
                    .select('cantidadLikes').exec()
                    .then(p => p?.cantidadLikes || 0);

                return { mensaje: 'Me Gusta ya existente, acción ignorada.', cantidadLikes };
            }
            throw error;
        }
    }

    // 5. QUITAR ME GUSTA
    async quitarMeGusta(publicacionId: string, autorId: string): Promise<any> {
        const resultado = await this.likeModel.deleteOne({
            publicacion: new Types.ObjectId(publicacionId),
            usuario: new Types.ObjectId(autorId)
        }).exec();

        if (resultado.deletedCount === 0) {
            throw new NotFoundException('El usuario no había dado "Me Gusta" a esta publicación.');
        }

        const publicacionActualizada = await this.publicacionModel.findByIdAndUpdate(
            publicacionId, { $inc: { cantidadLikes: -1 } }, { new: true }
        ).exec();

        if (!publicacionActualizada) {
            throw new NotFoundException('Publicación no encontrada. El "Me Gusta" fue quitado.');
        }

        return { mensaje: 'Me Gusta quitado.', cantidadLikes: publicacionActualizada.cantidadLikes };
    }

    // 6. AGREGAR COMENTARIO
    async agregarComentario(publicacionId: string, autorId: string, texto: string): Promise<Comentario> {
        const publicacion = await this.publicacionModel.findById(publicacionId);
        if (!publicacion) throw new NotFoundException('Publicación no encontrada');

        const comentario = new this.comentarioModel({
            publicacion: new Types.ObjectId(publicacionId),
            autor: new Types.ObjectId(autorId),
            texto,
        });

        return comentario.save(); // Guardar comentario en DB
    }

    // 7. OBTENER COMENTARIOS con paginación
    async obtenerComentarios(
        publicacionId: string,
        limit: number = 5,
        offset: number = 0
    ) {
        return this.comentarioModel
            .find({ publicacion: new Types.ObjectId(publicacionId) })
            .populate('autor', 'username nombre fotoPerfil')
            .sort({ createdAt: -1 })              // más recientes primero
            .skip(offset)
            .limit(limit)
            .lean();
    }

    // 8. EDITAR COMENTARIO
    async editarComentario(
        comentarioId: string,
        autorId: string,
        nuevoTexto: string
    ) {
        const comentario = await this.comentarioModel.findById(comentarioId);

        if (!comentario) throw new NotFoundException('Comentario no encontrado');

        if (comentario.autor.toString() !== autorId) {
            throw new BadRequestException('No puedes editar comentarios de otro usuario');
        }

        comentario.texto = nuevoTexto;
        comentario.modificado = true; // <<<<<<<< marcar como editado

        return comentario.save();
    }

    async eliminarComentario(comentarioId: string, autorId: string) {
    const comentario = await this.comentarioModel.findById(comentarioId);

    if (!comentario) {
        throw new NotFoundException('Comentario no encontrado');
    }

    if (comentario.autor.toString() !== autorId) {
        throw new ForbiddenException('No tienes permiso para eliminar este comentario');
    }

    await this.comentarioModel.findByIdAndDelete(comentarioId);

    return { mensaje: 'Comentario eliminado correctamente' };
    }

}





