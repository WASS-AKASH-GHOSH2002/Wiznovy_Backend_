import { Controller, Post, Get, Body, Param, Query, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('session/:sessionId/create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for session booking' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createSessionPaymentIntent(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string
  ) {
    return await this.paymentService.createSessionPayment(sessionId, userId);
  }

  @Post('course/:courseId/create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for course purchase' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createCoursePaymentIntent(
    @Param('courseId') courseId: string,
    @Body('amount') amount: number,
    @CurrentUser('id') userId: string
  ) {
    return await this.paymentService.createCoursePayment(courseId, userId, amount);
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
  async getPaymentHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0
  ) {
    return await this.paymentService.getPaymentHistory(userId, Number(limit), Number(offset));
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

  @Post('customer/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async createCustomer(
    @CurrentUser('id') userId: string,
    @Body('email') email: string,
    @Body('name') name: string
  ) {
    return await this.paymentService.createCustomer(email, name, userId);
  }

  @Get('methods/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  async getPaymentMethods(@Param('customerId') customerId: string) {
    return await this.paymentService.getPaymentMethods(customerId);
  }
}