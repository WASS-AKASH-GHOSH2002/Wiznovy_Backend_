import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private extractMessage(response: any): string {
    if (typeof response === 'string') {
      return response;
    }
    
    if (typeof response === 'object' && response !== null) {
      return response.message || response.error || 'An error occurred';
    }
    
    return 'An error occurred';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException 
      ? this.extractMessage(exception.getResponse()) 
      : 'Internal server error';

  
    this.logger.error(`${request.method} ${request.url}`, exception);
    
    if (!(exception instanceof HttpException)) {
      console.error('Unhandled Exception:', exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}