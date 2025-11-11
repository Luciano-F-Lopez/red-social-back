import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from '../config/cloudinary.service'; 
import { Publicacion } from './schemas/publicacion.schema';
import { Like } from './schemas/like.schema'; 
import { Usuario } from '../usuarios/schemas/usuario.schema'; 

@Injectable()
export class PublicacionesService {
    constructor(
        @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
        @InjectModel(Like.name) private likeModel: Model<Like>,
        @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
        private readonly cloudinaryService: CloudinaryService, 
    ) {}
    
    // 1. CREAR PUBLICACIÓN (POST)
    async crearPublicacion(
        titulo: string, 
        descripcion: string, 
        autorId: string, 
        file?: Express.Multer.File 
    ): Promise<Publicacion> {
        if (!titulo || !autorId) {
             throw new BadRequestException('Título y autor son obligatorios.');
        }

        let urlImagen: string | undefined;
        if (file) {
            try {
                const uploadResult = await this.cloudinaryService.uploadImage(file);
                urlImagen = uploadResult.secure_url; 
            } catch (error) {
                throw new BadRequestException(`Error al subir la imagen: ${error.message}`);
            }
        }

        const nuevaPublicacion = new this.publicacionModel({
            titulo,
            descripcion,
            autor: new Types.ObjectId(autorId),
            urlImagen, 
        });

        return nuevaPublicacion.save();
    }
    
    // 2. OBTENER PUBLICACIONES (GET) - Paginación, Ordenamiento y Filtro
    async obtenerPublicaciones(
      limit: number = 10, offset: number = 0,
      orderBy: 'fecha' | 'likes' = 'fecha', usuarioId?: string
    ): Promise<{ publicaciones: Publicacion[], total: number }> {
    
    // 💡 SOLUCIÓN: Definir sortCriteria directamente con el tipo correcto
    const sortCriteria: { [key: string]: 1 | -1 | 'asc' | 'desc' } = 
        orderBy === 'likes' 
            ? { cantidadLikes: 'desc' } 
            : { createdAt: 'desc' };

    const filter: any = { borradoLogico: false };

    if (usuarioId) {
        filter.autor = new Types.ObjectId(usuarioId);
    }

    const [publicaciones, total] = await Promise.all([
        this.publicacionModel
            .find(filter)
            .sort(sortCriteria) // <--- Ya no debería marcar error
            .skip(offset).limit(limit)
            .populate('autor', 'nombre fotoPerfil').exec(),
        this.publicacionModel.countDocuments(filter).exec(),
    ]);
    
    return { publicaciones, total };
}
    
    // 3. BAJA LÓGICA (DELETE)
    async eliminarPublicacion(publicacionId: string, usuarioPeticionId: string): Promise<Publicacion> {
        const publicacion = await this.publicacionModel.findById(publicacionId).exec();
        
        if (!publicacion || publicacion.borradoLogico) {
            throw new NotFoundException('Publicación no encontrada.');
        }

        if (publicacion.autor.toString() !== usuarioPeticionId) {
            throw new BadRequestException('No tienes permiso para eliminar esta publicación.');
        }

        publicacion.borradoLogico = true;
        return publicacion.save();
    }

    async darMeGusta(publicacionId: string, autorId: string): Promise<any> {
        const publicacionObjId = new Types.ObjectId(publicacionId);
        const autorObjId = new Types.ObjectId(autorId);

        try {
            await this.likeModel.create({ publicacion: publicacionObjId, usuario: autorObjId });

            const publicacionActualizada = await this.publicacionModel.findByIdAndUpdate(
                publicacionId, { $inc: { cantidadLikes: 1 } }, { new: true } 
            ).exec();

            if (!publicacionActualizada) {
                await this.likeModel.deleteOne({ publicacion: publicacionObjId, usuario: autorObjId }).exec();
                throw new NotFoundException('Publicación no encontrada.');
            }

            return { mensaje: 'Me Gusta añadido.', cantidadLikes: publicacionActualizada.cantidadLikes };
        } catch (error) {
            if (error.code === 11000) {
                console.warn(`Usuario ${autorId} intentó dar like a ${publicacionId} que ya tenía.`);
                return { 
                    mensaje: 'Me Gusta ya existente, acción ignorada.', 
                    cantidadLikes: await this.publicacionModel.findById(publicacionId).select('cantidadLikes').exec().then(p => p?.cantidadLikes || 0) 
                };
            }
            throw error; 
        }
    }
    
    // 5. QUITAR ME GUSTA (DELETE /like)
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
}

