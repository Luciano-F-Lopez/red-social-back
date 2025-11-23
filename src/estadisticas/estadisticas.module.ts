import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';

import { Publicacion, PublicacionSchema } from '../publicaciones/schemas/publicacion.schema';
import { Like, LikeSchema } from '../publicaciones/schemas/like.schema';
import { Comentario, ComentarioSchema } from '../publicaciones/schemas/comentario.schema';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule,
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Comentario.name, schema: ComentarioSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}


