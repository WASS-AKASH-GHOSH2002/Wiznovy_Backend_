import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Log the full error for debugging
    console.error('=== GLOBAL EXCEPTION FILTER ===');
    console.error('URL:', request.url);
    console.error('Method:', request.method);
    console.error('Body:', request.body);
    console.error('Exception:', exception);
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      console.error('Error message:', exception.message);
      console.error('Error stack:', exception.stack);
    }

    console.error('Response status:', status);
    console.error('Response message:', message);
    console.error('===============================');

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}