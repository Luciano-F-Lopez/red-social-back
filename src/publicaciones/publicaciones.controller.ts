import { Controller, Post, Body, Get, BadRequestException } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  async crear(@Body() body: any) {
    try {
      const { contenido, autorId, imagen } = body;
      return await this.publicacionesService.crearPublicacion(contenido, autorId, imagen);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async listar() {
    return this.publicacionesService.obtenerPublicaciones();
  }
}

