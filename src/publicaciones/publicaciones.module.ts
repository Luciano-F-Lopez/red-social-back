import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema';
import { Like, LikeSchema } from './schemas/like.schema'; 
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { CloudinaryModule } from '../config/cloudinary.module'; 

@Module({
  imports: [
    CloudinaryModule, 
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Usuario.name, schema: UsuarioSchema }, 
    ]),
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService], 
})
export class PublicacionesModule {}

