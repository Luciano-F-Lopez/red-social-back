import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema';

@Schema({ timestamps: true })
export class Publicacion extends Document {
  @Prop({ required: true })
  contenido: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autor: Usuario;

  @Prop()
  imagen?: string; 
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
