import { TypeOrmModule } from '@nestjs/typeorm'
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

import { MailModule } from './services/mail/mail.module'
import { RedisModule } from './services/redis/redis.module'
import { DynamicDatabaseModule } from './services/dynamic-database/dynamic-database.module'
import { BusinessHeaderMiddleware } from './middleware/business-header.middleware'
import { AuthModule } from './api/auth/auth.module'
import { BusinessModule } from './api/business/business.module'
import { BusinessSizeModule } from './api/business-size/business-size.module'
import { CohortModule } from './api/cohort/cohort.module'
import { ConsultorTypeModule } from './api/consultor-type/consultor-type.module'
import { ContactInformationModule } from './api/contact-information/contact-information.module'
import { DocumentTypeModule } from './api/document-type/document-type.module'
import { EconomicActivityModule } from './api/economic-activity/economic-activity.module'
import { EducationLevelModule } from './api/education-level/education-level.module'
import { ExpertModule } from './api/expert/expert.module'
import { GenderModule } from './api/gender/gender.module'
import { MarketScopeModule } from './api/market-scope/market-scope.module'
import { PositionModule } from './api/position/position.module'
import { ProductStatusModule } from './api/product-status/product-status.module'
import { RoleModule } from './api/role/role.module'
import { ServiceModule } from './api/service/service.module'
import { StrengtheningAreaModule } from './api/strengthening_area/strengthening_area.module'
import { StrengtheningLevelModule } from './api/strengthening_level/strengthening_level.module'
import { UserModule } from './api/user/user.module'
import { PostModule } from './api/post/post.module'
import { PostCategoryModule } from './api/post-category/post-category.module'
import { AccompanimentModule } from './api/accompaniment/accompaniment.module'
import { SessionModule } from './api/session/session.module'
import { MenuModule } from './api/menu/menu.module'
import { ChatModule } from './api/chat/chat.module'
import { SessionActivityModule } from './api/session_activity/session_activity.module'
import { SessionAttachmentModule } from './api/session_attachment/session_attachment.module'
import { PlatformModule } from './api/platform/platform.module'
import { ReportTypeModule } from './api/report-type/report-type.module'
import { ReportModule } from './api/report/report.module'
import { DashboardModule } from './api/dashboard/dashboard.module'
import { SessionStatusModule } from './api/session_status/session_status.module'
import { ImageUploadModule } from './api/image-upload/image-upload.module'

import envVars from './config/env'

@Module({
	imports: [
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', envVars.UPLOADS_DIR),
			serveRoot: `/${envVars.UPLOADS_DIR}`
		}),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', 'assets'),
			serveRoot: '/assets'
		}),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', 'generated'),
			serveRoot: '/generated'
		}),
		TypeOrmModule.forRoot({
			type: 'mysql',
			name: envVars.DB_ALIAS_ADMIN,
			host: envVars.DB_HOST_ADMIN,
			port: envVars.DB_PORT_ADMIN,
			username: envVars.DB_USER_ADMIN,
			password: envVars.DB_PASSWORD_ADMIN,
			database: envVars.DB_NAME_ADMIN,
			synchronize: false,
			autoLoadEntities: true,
			timezone: 'local'
		}),
		MailModule,
		RedisModule,
		DynamicDatabaseModule,
		AuthModule,
		BusinessModule,
		BusinessSizeModule,
		CohortModule,
		ConsultorTypeModule,
		ContactInformationModule,
		DocumentTypeModule,
		EconomicActivityModule,
		EducationLevelModule,
		ExpertModule,
		GenderModule,
		MarketScopeModule,
		PositionModule,
		ProductStatusModule,
		RoleModule,
		ServiceModule,
		StrengtheningAreaModule,
		StrengtheningLevelModule,
		UserModule,
		PostModule,
		PostCategoryModule,
		AccompanimentModule,
		SessionModule,
		MenuModule,
		ChatModule,
		SessionActivityModule,
		SessionAttachmentModule,
		PlatformModule,
		ReportTypeModule,
		ReportModule,
		DashboardModule,
		SessionStatusModule,
		ImageUploadModule
	],
	controllers: [],
	providers: []
})

export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(BusinessHeaderMiddleware)
			.forRoutes('*')
	}
}
