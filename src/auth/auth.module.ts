import { Module,forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CloudinaryModule } from '../config/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './guards/admin.guard';


@Module({
  imports: [
    forwardRef(() => UsuariosModule),
    CloudinaryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecreto123',
      signOptions: { expiresIn: '15m' }, // token dura 15 minutos
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard,],
  exports: [AuthService,AdminGuard,JwtModule],
})
export class AuthModule {}

