import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'node:path';
import { AccountModule } from './account/account.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FaqsModule } from './faqs/faqs.module';
import { MenusModule } from './menus/menus.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PagesModule } from './pages/pages.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SettingsModule } from './settings/settings.module';
import { UserDetailsModule } from './user-details/user-details.module';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';
import { LanguagesModule } from './languages/languages.module';
import { NodeMailerModule } from './node-mailer/node-mailer.module';
import { StaffDetailsModule } from './staff-details/staff-details.module';
import { BannerModule } from './banner/banner.module';
import { RatingFeedbackModule } from './rating-feedback/rating-feedback.module';
import { NewsModule } from './news/news.module';
import { NoticeModule } from './notice/notice.module';
import { LoginHistoryModule } from './login-history/login-history.module';
import { RatingModule } from './rating/rating.module';
import { WalkThroughModule } from './walk-through/walk-through.module';
import { TopicModule } from './topic/topic.module';
import { GoalModule } from './goal/goal.module';
import { CountryModule } from './country/country.module';
import { BudgetModule } from './budget/budget.module';
import { SubjectsModule } from './subjects/subjects.module';
import { CourseModule } from './course/course.module';
import { CategoriesModule } from './categories/categories.module';
import { TutorDetailsModule } from './tutor-details/tutor-details.module';
import { CityModule } from './city/city.module';
import { GlobalSearchModule } from './global-search/global-search.module';
import { VideoLectureModule } from './video-lecture/video-lecture.module';
import { BookModule } from './book/book.module';
import { ClassModule } from './class/class.module';
import { TutorAvailabilityModule } from './tutor-availability/tutor-availability.module';
import { BoookImagesModule } from './boook-images/boook-images.module';
import { StudyMaterialModule } from './study-material/study-material.module';
import { UserProgressModule } from './user-progress/user-progress.module';
import { UnitModule } from './unit/unit.module';
import { UserPurchaseModule } from './user-purchase/user-purchase.module';
import { SessionModule } from './session/session.module';
import { FixedSessionModule } from './fixed-session/fixed-session.module';
import { QualificationModule } from './qualification/qualification.module';;
import { StateModule } from './state/state.module';
import { PaymentModule } from './payment/payment.module';
import { WalletModule } from './wallet/wallet.module';
import { BankDetailsModule } from './bank-details/bank-details.module';
import { TutorPayoutModule } from './tutor-payout/tutor-payout.module';
import { SavedBooksModule } from './saved-books/saved-books.module';
import { WalletTransactionModule } from './wallet-transaction/wallet-transaction.module';
import { ZoomModule } from './zoom/zoom.module';
import { ContactUsCategoryModule } from './contact-us-category/contact-us-category.module';
import { AdminActionLogModule } from './admin-action-log/admin-action-log.module';

@Module({
  imports: [
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env'
}),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), 
      serveRoot: '/uploads', 
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.WIZNOVY_DB_HOST,
      port: Number(process.env.WIZNOVY_DB_PORT),
      username: process.env.WIZNOVY_USER_NAME,
      password: process.env.WIZNOVY_DB_PASS,
      database: process.env.WIZNOVY_DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize:false,
     
       logging: ['error'],
      
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    AuthModule,
    AccountModule,
    DashboardModule,
    FaqsModule,
    SettingsModule,
    MenusModule,
    NotificationsModule,
    PermissionsModule,
    UserPermissionsModule,
    UserDetailsModule,
    PagesModule,
    ContactUsModule,
    LanguagesModule,
    NodeMailerModule,
    StaffDetailsModule, 
    BannerModule,
    RatingFeedbackModule,
    NewsModule,
    NoticeModule,
    LoginHistoryModule,
    RatingModule,
    WalkThroughModule,
    TopicModule,
    GoalModule,
    CountryModule,
    BudgetModule,
    SubjectsModule,
    CourseModule,
    CategoriesModule,
    TutorDetailsModule,
    CityModule,
    GlobalSearchModule,
    VideoLectureModule,
    BookModule,
    ClassModule,
    TutorAvailabilityModule,
    BoookImagesModule,
    StudyMaterialModule,
    UserProgressModule,
    UnitModule,
    UserPurchaseModule,
    SessionModule,
    FixedSessionModule,
    QualificationModule,
    StateModule,
    PaymentModule,
    WalletModule,
    BankDetailsModule,
    TutorPayoutModule,
    SavedBooksModule,
    WalletTransactionModule,
    ZoomModule,
    ContactUsCategoryModule,
    AdminActionLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }