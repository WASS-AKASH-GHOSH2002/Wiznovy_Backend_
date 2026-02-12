import { Controller, Post, Get, Body, Param, Query, Headers, RawBodyRequest, Req, UseGuards, UsePipes, ValidationPipe, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentPaginationDto } from './dto/payment-pagination.dto';
import { Account } from 'src/account/entities/account.entity';
import { UserRole } from 'src/enum';
import { Response } from 'express';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('session/create-intent/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for session booking' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createSessionPaymentIntent(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user:any
  ) {
    return await this.paymentService.createSessionPayment(sessionId, user.id);
  }

  @Post('course/create-intent/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for course purchase' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createCoursePaymentIntent(
    @Param('courseId') courseId: string,
    @CurrentUser() user:Account
  ) {
    return await this.paymentService.createCoursePayment(courseId, user.id);
  }

  @Post('confirm/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return await this.paymentService.confirmPayment(paymentIntentId);
  }

  @Post('refund/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user payment history (Admin only)' })
  @ApiResponse({ status: 200, description: 'All payment history retrieved' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAllPaymentHistory(@Query() dto: PaymentPaginationDto) {
    return await this.paymentService.getAllPaymentHistory(dto);
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

  // @Post('customer/create')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create Stripe customer' })
  // @ApiResponse({ status: 201, description: 'Customer created successfully' })
  // async createCustomer(
  //   @CurrentUser('id') userId: string,
  //   @Body('email') email: string,
  //   @Body('name') name: string
  // ) {
  //   return await this.paymentService.createCustomer(email, name, userId);
  // }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
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
}