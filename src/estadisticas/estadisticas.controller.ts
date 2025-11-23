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
  @UseGuards(AdminGuard)
  @Get('publicaciones-por-dia')
  publicacionesPorDia(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.publicacionesPorDia(desde, hasta);
  }
  @UseGuards(AdminGuard)
  @Get('ranking-publicaciones')
  rankingPublicaciones(@Query('limit') limit = '10') {
    return this.estadisticasService.rankingPublicaciones(Number(limit));
  }
  @UseGuards(AdminGuard)
  @Get('likes-por-usuario')
  likesPorUsuario() {
    return this.estadisticasService.likesPorUsuario();
  }
  @UseGuards(AdminGuard)    
  @Get('publicaciones-con-imagen')
  publicacionesConImagen() {
    return this.estadisticasService.publicacionesConImagen();
  }
  @UseGuards(AdminGuard)
  @Get('publicaciones-por-mes')
  publicacionesPorMes(@Query('meses') meses = '12') {
    return this.estadisticasService.publicacionesPorMes(Number(meses));
  }
  @UseGuards(AdminGuard)
  @Get('likes-por-mes')
  likesPorMes(@Query('meses') meses = '12') {
    return this.estadisticasService.likesPorMes(Number(meses));
  }
  @UseGuards(AdminGuard)
  @Get('comentarios-por-mes')
  comentariosPorMes(@Query('meses') meses = '12') {
    return this.estadisticasService.comentariosPorMes(Number(meses));
  }
}

