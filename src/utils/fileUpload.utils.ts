import { NotAcceptableException, HttpStatus } from '@nestjs/common';
import { CustomException } from '../shared/exceptions/custom.exception';
import { MESSAGE_CODES } from '../shared/constants/message-codes';
import { MessageType } from '../shared/constants/message-type.enum';
import axios from 'axios';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
    return callback(
      new CustomException(MESSAGE_CODES.VALIDATION_INVALID_FILE_TYPE, MessageType.ERROR, HttpStatus.BAD_REQUEST),
      false,
    );
  }
  callback(null, true);
};

export const courseImageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
    return callback(
      new CustomException(MESSAGE_CODES.VALIDATION_INVALID_FILE_TYPE, MessageType.ERROR, HttpStatus.BAD_REQUEST),
      false,
    );
  }
  
  if (file.size && file.size > 5 * 1024 * 1024) {
    return callback(
      new CustomException(MESSAGE_CODES.VALIDATION_FILE_TOO_LARGE, MessageType.ERROR, HttpStatus.BAD_REQUEST),
      false,
    );
  }
  
  callback(null, true);
};

export const documentFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
    return callback(
      new CustomException(MESSAGE_CODES.VALIDATION_INVALID_DOCUMENT_TYPE, MessageType.ERROR, HttpStatus.BAD_REQUEST),
      false,
    );
  }
  callback(null, true);
};

export const audioFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(mp3)$/)) {
    return callback(
      new NotAcceptableException('Only mp3 audio files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

export const videoFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(mp4|webm|avi)$/)) {
    return callback(
      new NotAcceptableException('Only mp4, webm, avi video files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

export async function uploadFileHandler(name, buffer) {
  try {
    const newBuffer = Buffer.from(buffer.toString('binary'), 'binary');
    const payload = await axios.put(
      process.env.SM_CDN_STORAGE + name,
      newBuffer,
      { headers: { AccessKey: process.env.SM_CDN_ACCESS } },
    );
    return payload.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    return { HttpCode: 405 };
  }
}

export async function deleteFileHandler(name) {
  try {
    const payload = await axios.delete(process.env.SM_CDN_STORAGE + name, {
      headers: { AccessKey: process.env.SM_CDN_ACCESS },
    });
    return payload.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    return { HttpCode: 405 };
  }
}
