import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'red-social',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    public_id: (req: any, file: any) => `${Date.now()}-${file.originalname}`,
  } as any, 
});

export const upload = multer({ storage });
