import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ 
    timestamps: true 
})
export class Like {
    @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true })
    publicacion: Types.ObjectId; 

    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    usuario: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ publicacion: 1, usuario: 1 }, { unique: true });