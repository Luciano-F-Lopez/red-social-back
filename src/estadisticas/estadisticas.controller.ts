import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @UseGuards(AdminGuard)
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.publicacionesPorUsuario(desde, hasta);
  }
  @UseGuards(AdminGuard)
  @Get('comentarios-por-usuario')
  comentariosPorUsuario(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.comentariosPorUsuario(desde, hasta);
  }
  @UseGuards(AdminGuard)
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.comentariosPorPublicacion(desde, hasta);
  }
}

