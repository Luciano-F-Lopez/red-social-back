// src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response'; 


@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { folder: 'red-social-profiles' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          
          if (result) {
            resolve(result as unknown as CloudinaryResponse); 
          } else {
            reject(new Error("Cloudinary no retornó un objeto de resultado."));
          }
        },
      );
      uploadStream.end(file.buffer); 
    });
  }
}