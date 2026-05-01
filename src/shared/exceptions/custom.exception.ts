import { HttpException, HttpStatus } from '@nestjs/common';
import { MessageType } from '../constants/message-type.enum';

export class CustomException extends HttpException {
  constructor(
    messageCodes: { code: string; message: string; title?: string },
    type: MessageType,
    status: HttpStatus,
  ) {
    super(
      {
        code: messageCodes.code,
        title: messageCodes.title,
        message: messageCodes.message,
        type,
      },
      status,
    );
  }
}
