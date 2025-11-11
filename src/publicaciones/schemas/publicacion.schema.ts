import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema'; 


export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion { 
    
    @Prop({ required: true, trim: true })
    titulo: string;

    @Prop({ required: true })
    descripcion: string; 
    
    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    autor: Types.ObjectId; 
    
    @Prop()
    urlImagen?: string; 
    
    @Prop({ default: 0 })
    cantidadLikes: number;
    
    @Prop({ default: false })
    borradoLogico: boolean; 
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
