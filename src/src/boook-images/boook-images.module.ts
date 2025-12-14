import { Module } from '@nestjs/common';
import { BoookImagesService } from './boook-images.service';
import { BoookImagesController } from './boook-images.controller';

@Module({
  controllers: [BoookImagesController],
  providers: [BoookImagesService],
})
export class BoookImagesModule {}
