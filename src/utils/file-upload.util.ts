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
        files: 10,
        fieldSize: 1024 * 1024
      },
    };
  }

  static createSingleFileConfig(destination: string, fileSize: number) {
    const safeFileSize = Math.min(fileSize, FileSizeLimit.VIDEO_SIZE);
    return {
      storage: this.createStorageConfig(destination),
      limits: { 
        fileSize: safeFileSize,
        files: 1,
        fieldSize: 1024 * 1024
      },
    };
  }
}