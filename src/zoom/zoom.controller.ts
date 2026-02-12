import { Controller, Get, Param } from '@nestjs/common';
import { ZoomService } from './zoom.service';

@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  @Get('test-connection')
  testConnection() {
    return this.zoomService.testZoomConnection();
  }

  @Get('check-table')
  checkTable() {
    return this.zoomService.checkDatabaseTable();
  }

  @Get('session/:sessionId')
  findBySessionId(@Param('sessionId') sessionId: string) {
    return this.zoomService.findBySessionId(sessionId);
  }
}