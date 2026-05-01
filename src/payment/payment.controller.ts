import { Controller, Post, Get, Body, Param, Query, Headers, RawBodyRequest, Req, UseGuards, UsePipes, ValidationPipe, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { AdminProtected } from '../admin-action-log/decorators/admin-protected.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentPaginationDto } from './dto/payment-pagination.dto';
import { Account } from 'src/account/entities/account.entity';
import { PermissionAction, UserRole } from 'src/enum';
import { Response } from 'express';
import { CreateSessionPaymentDto, CreateCoursePaymentDto } from './dto/payment.dto';
import { sendCsvResponse, generateCsvFileName } from '../utils/csv.utils';
import { SabbathGuard } from '../sabbath/sabbath.guard';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('session/create-intent')
  @UseGuards(JwtAuthGuard, SabbathGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for session booking' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createSessionPaymentIntent(
    @Body() dto: CreateSessionPaymentDto,
    @CurrentUser() user: any
  ) {
    return await this.paymentService.createSessionPayment(dto.sessionId, user.id, dto.paymentMethod);
  }

  @Post('course/create-intent')
  @UseGuards(JwtAuthGuard, SabbathGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for course purchase' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createCoursePaymentIntent(
    @Body() dto: CreateCoursePaymentDto,
    @CurrentUser() user: Account
  ) {
    return await this.paymentService.createCoursePayment(dto.courseId, user.id, dto.paymentMethod);
  }







  @Post('refund/:paymentIntentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create refund for payment' })
  @ApiResponse({ status: 200, description: 'Refund created successfully' })
  async createRefund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: string
  ) {
    return await this.paymentService.createRefund(paymentIntentId, amount, reason);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPaymentHistory(
    @CurrentUser() user: any,
    @Query() dto: PaymentPaginationDto
  ) {
    return await this.paymentService.getPaymentHistory(user.id, dto);
  }

  @Get('admin/all-payments')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
    @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiOperation({ summary: 'Get all user payment history (Admin only)' })
  @ApiResponse({ status: 200, description: 'All payment history retrieved' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAllPaymentHistory(@Query() dto: PaymentPaginationDto) {
    return await this.paymentService.getAllPaymentHistory(dto);
  }

  @Get('admin/export-csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export payments as CSV with date range filter (Admin only)' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportPaymentsCsv(@Query() dto: PaymentPaginationDto, @Res() res: Response) {
    const csv = await this.paymentService.exportPaymentsCsv(dto);
    sendCsvResponse(res, csv, generateCsvFileName('wiznovy-payments-export'));
  }

  @Get('admin/history/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history by account ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPaymentHistoryByAccountId(
    @Param('accountId') accountId: string,
    @Query() dto: PaymentPaginationDto
  ) {
    return await this.paymentService.getPaymentHistory(accountId, dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    return await this.paymentService.handleWebhook(signature, req.rawBody);
  }



  @Get('methods/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  async getPaymentMethods(@Param('customerId') customerId: string) {
    return await this.paymentService.getPaymentMethods(customerId);
  }

  @Get('success')
  @ApiOperation({ summary: 'Payment success redirect' })
  async paymentSuccess(@Query('session_id') sessionId?: string) {
    return { message: 'Payment completed successfully', sessionId };
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Payment cancel redirect' })
  async paymentCancel() {
    return { message: 'Payment was cancelled' };
  }

  @Get('purchase/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
   @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get purchase details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Purchase details retrieved' })
  async getPurchaseById(@Param('id') id: string) {
    return await this.paymentService.getPurchaseById(id);
  }

  @Post('test/confirm-payment/:purchaseId')
  @ApiOperation({ summary: 'Test: Bypass webhook and confirm payment directly' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  async testConfirmPayment(@Param('purchaseId') purchaseId: string) {
    return await this.paymentService.testConfirmPayment(purchaseId);
  }

  @Get('invoice/download/:purchaseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice PDF for purchase' })
  @ApiResponse({ status: 200, description: 'Invoice PDF downloaded' })
  async downloadInvoice(
    @Param('purchaseId') purchaseId: string,
    @CurrentUser() user:Account,
    @Res() res: Response
  ) {
    const { filePath, fileName } = await this.paymentService.downloadInvoice(purchaseId, user.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
  }

  @Get('admin/invoice/download/:purchaseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice PDF for any purchase (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice PDF downloaded' })
  async downloadInvoiceAdmin(
    @Param('purchaseId') purchaseId: string,
    @Res() res: Response
  ) {
    const { filePath, fileName } = await this.paymentService.downloadInvoiceAdmin(purchaseId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
  }

  @Get('admin/invoice/course/:purchaseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download course payment invoice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course invoice PDF downloaded' })
  async downloadCourseInvoiceAdmin(
    @Param('purchaseId') purchaseId: string,
    @Res() res: Response
  ) {
    const { filePath, fileName } = await this.paymentService.downloadCourseInvoiceAdmin(purchaseId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
  }

  @Get('admin/invoice/session/:purchaseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'payment'])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download session payment invoice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Session invoice PDF downloaded' })
  async downloadSessionInvoiceAdmin(
    @Param('purchaseId') purchaseId: string,
    @Res() res: Response
  ) {
    const { filePath, fileName } = await this.paymentService.downloadSessionInvoiceAdmin(purchaseId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
  }
}