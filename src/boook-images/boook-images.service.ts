import { Injectable } from '@nestjs/common';
import { CreateBoookImageDto } from './dto/create-boook-image.dto';
import { UpdateBoookImageDto } from './dto/update-boook-image.dto';

@Injectable()
export class BoookImagesService {
  create(createBoookImageDto: CreateBoookImageDto) {
    return 'This action adds a new boookImage';
  }

  findAll() {
    return `This action returns all boookImages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} boookImage`;
  }

  update(id: number, updateBoookImageDto: UpdateBoookImageDto) {
    return `This action updates a #${id} boookImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} boookImage`;
  }
}
