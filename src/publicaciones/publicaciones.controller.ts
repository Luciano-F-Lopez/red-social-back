import { Controller, Post, Body, Get, BadRequestException,NotFoundException, UseInterceptors, UploadedFile, Query, Param, Delete,Put} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service';

@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly publicacionesService: PublicacionesService) {}

    // Crear publicación con imagen (opcional)
    @Post()
    @UseInterceptors(FileInterceptor('imagen')) 
    async crear(
        @UploadedFile() file: Express.Multer.File, 
        @Body() body: any 
    ) {
        const { titulo, descripcion, autorId } = body; 
        if (!titulo || !autorId || !descripcion) {
            throw new BadRequestException('Faltan campos obligatorios: título, descripción y autorId.');
        }
        return await this.publicacionesService.crearPublicacion(titulo, descripcion, autorId, file);
    }

    // Listar publicaciones con paginación y opción de ordenar por fecha o likes
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

    // Obtener publicación por ID
    @Get(':id')
    async obtenerPorId(@Param('id') publicacionId: string) {
        const publicacion = await this.publicacionesService.obtenerPublicacionPorId(publicacionId);
        if (!publicacion) {
            throw new NotFoundException('Publicación no encontrada');
        }
        return publicacion;
    }

    
    // Dar Me Gusta a una publicación
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

    // Quitar Me Gusta de una publicación
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

    // Eliminación lógica de una publicación
    @Delete(':id')
    async eliminarPublicacion(
        @Param('id') publicacionId: string,
        @Body('usuarioPeticionId') usuarioPeticionId: string,
        @Body('perfil') perfil: string  
    ) {
        if (!usuarioPeticionId) {
             throw new BadRequestException('Se requiere el ID del usuario para eliminar.');
        }
        return await this.publicacionesService.eliminarPublicacion(publicacionId, usuarioPeticionId,perfil);
    }

    // Agregar comentario a una publicación
    @Post(':id/comentarios')
    async agregarComentario(
        @Param('id') publicacionId: string,
        @Body() body: { autorId: string; texto: string }
    ) {
        const { autorId, texto } = body;
        if (!autorId || !texto) {
            throw new BadRequestException('Se requiere autorId y texto del comentario.');
        }
        return this.publicacionesService.agregarComentario(publicacionId, autorId, texto);
    }

    // Obtener comentarios paginados
    @Get(':id/comentarios')
    async obtenerComentarios(
        @Param('id') publicacionId: string,
        @Query('limit') limit: number = 5,
        @Query('page') page: number = 1
    ) {
        const offset = (Number(page) - 1) * Number(limit);
        
        return this.publicacionesService.obtenerComentarios(
            publicacionId,
            Number(limit),
            offset
        );
    }


    // Editar comentario
    @Put('comentarios/:comentarioId')
    async editarComentario(
        @Param('comentarioId') comentarioId: string,
        @Body() body: { autorId: string; texto: string }
    ) {
        const { autorId, texto } = body;
        if (!autorId || !texto) {
            throw new BadRequestException('autorId y texto son obligatorios');
        }

        return this.publicacionesService.editarComentario(comentarioId, autorId, texto);
    }

    @Delete('comentarios/:comentarioId')
    async eliminarComentario(
    @Param('comentarioId') comentarioId: string,
    @Body('autorId') autorId: string,
    ) {
    return this.publicacionesService.eliminarComentario(comentarioId, autorId);
    }
}



