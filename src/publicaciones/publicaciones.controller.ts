import { 
    Controller, Post, Body, Get, BadRequestException, 
    UseInterceptors, UploadedFile, Query, Param, Delete, 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service';

@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly publicacionesService: PublicacionesService) {}

    // POST: Crear Publicación con imagen
    @Post()
    @UseInterceptors(FileInterceptor('imagen')) 
    async crear(
        @UploadedFile() file: Express.Multer.File, 
        @Body() body: any 
    ) {
        try {
            const { titulo, descripcion, autorId } = body; 
            
            if (!titulo || !autorId || !descripcion) {
                throw new BadRequestException('Faltan campos obligatorios: título, descripción y autorId.');
            }

            // El servicio maneja Cloudinary y Mongoose
            return await this.publicacionesService.crearPublicacion(titulo, descripcion, autorId, file);
            
        } catch (error) {
            // Maneja errores específicos como la subida a Cloudinary
            throw new BadRequestException(`Error al crear la publicación: ${error.message}`);
        }
    }

    // GET: Listar Publicaciones con paginación
    @Get()
    async listar(
        @Query('limit') limit: number = 10,
        @Query('offset') offset: number = 0,
        @Query('orderBy') orderBy: 'fecha' | 'likes' = 'fecha',
        @Query('usuarioId') usuarioId?: string
    ) {
        return this.publicacionesService.obtenerPublicaciones(
            Number(limit), Number(offset), orderBy, usuarioId
        );
    }
    
    // POST: Dar Me Gusta
    @Post(':id/like')
    async darMeGusta(
        @Param('id') publicacionId: string,
        @Body('autorId') autorId: string 
    ) {
        if (!autorId) {
             throw new BadRequestException('Se requiere el ID del usuario para dar "Me Gusta".');
        }
        return await this.publicacionesService.darMeGusta(publicacionId, autorId);
    }

    // DELETE: Quitar Me Gusta
    @Delete(':id/like')
    async quitarMeGusta(
        @Param('id') publicacionId: string,
        @Body('autorId') autorId: string
    ) {
        if (!autorId) {
             throw new BadRequestException('Se requiere el ID del usuario para quitar "Me Gusta".');
        }
        return await this.publicacionesService.quitarMeGusta(publicacionId, autorId);
    }

    // DELETE: Baja Lógica de una publicación
    @Delete(':id')
    async eliminarPublicacion(
        @Param('id') publicacionId: string,
        @Body('usuarioPeticionId') usuarioPeticionId: string 
    ) {
        if (!usuarioPeticionId) {
             throw new BadRequestException('Se requiere el ID del usuario para eliminar.');
        }
        return await this.publicacionesService.eliminarPublicacion(publicacionId, usuarioPeticionId);
    }
}

