import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class FileUploadErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.code === 'LIMIT_FILE_SIZE') {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'File size too large. Maximum allowed size is 5MB.';
    } else if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Unexpected file field or too many files uploaded.';
    } else if (exception.code === 'LIMIT_FILE_COUNT') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Too many files uploaded.';
    } else if (exception.message?.includes('large content')) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Request entity too large. Please reduce file size or content length.';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: status === HttpStatus.PAYLOAD_TOO_LARGE ? 'Payload Too Large' : 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}