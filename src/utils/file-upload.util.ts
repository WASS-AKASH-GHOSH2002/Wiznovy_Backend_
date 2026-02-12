import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { FileSizeLimit } from 'src/enum';

export class FileUploadUtil {
  static createStorageConfig(destination: string) {
    return diskStorage({
      destination,
      filename: (req, file, callback) => {
        const randomName = randomBytes(16).toString('hex');
        return callback(null, `${randomName}${extname(file.originalname)}`);
      },
    });
  }

  static createUploadConfig(destination: string, fileSize: number = FileSizeLimit.IMAGE_SIZE) {
    return {
      storage: this.createStorageConfig(destination),
      limits: {
        fileSize,
        files: 10,
        fields: 15,
        fieldNameSize: 100,
        fieldSize: 2097152,
        parts: 20
      },
    };
  }

  static createMultiFieldConfig(videoPath: string, thumbnailPath: string) {
    return {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const dest = file.fieldname === 'video' ? videoPath : thumbnailPath;
          callback(null, dest);
        },
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.VIDEO_SIZE,
        files: 2,
        fields: 10,
        fieldNameSize: 100,
        fieldSize: 2097152,
        parts: 12
      },
    };
  }
}