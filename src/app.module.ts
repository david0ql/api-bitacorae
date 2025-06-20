import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

import { MailModule } from './services/mail/mail.module'
import { RedisModule } from './services/redis/redis.module'
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
import { AdminModule } from './api/admin/admin.module'
import { AuditorModule } from './api/auditor/auditor.module'

import { Business } from 'src/entities/Business'
import { BusinessSize } from './entities/BusinessSize'
import { Cohort } from './entities/Cohort'
import { ConsultorType } from './entities/ConsultorType'
import { ContactInformation } from 'src/entities/ContactInformation'
import { DocumentType } from 'src/entities/DocumentType'
import { EconomicActivity } from 'src/entities/EconomicActivity'
import { EducationLevel } from 'src/entities/EducationLevel'
import { Expert } from 'src/entities/Expert'
import { Gender } from 'src/entities/Gender'
import { MarketScope } from './entities/MarketScope'
import { Position } from './entities/Position'
import { ProductStatus } from './entities/ProductStatus'
import { Role } from 'src/entities/Role'
import { RolePermission } from './entities/RolePermission'
import { Permission } from './entities/Permission'
import { Service } from './entities/Service'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { StrengtheningLevel } from './entities/StrengtheningLevel'
import { User } from 'src/entities/User'
import { Post } from './entities/Post'
import { PostCategory } from './entities/PostCategory'
import { Accompaniment } from './entities/Accompaniment'
import { Session } from './entities/Session'
import { SessionStatus } from './entities/SessionStatus'
import { SessionPreparationFile } from './entities/SessionPreparationFile'
import { Menu } from './entities/Menu'
import { Chat } from './entities/Chat'
import { ChatMessage } from './entities/ChatMessage'
import { SessionActivity } from './entities/SessionActivity'
import { SessionActivityResponse } from './entities/SessionActivityResponse'
import { SessionAttachment } from './entities/SessionAttachment'
import { Admin } from './entities/Admin'
import { Auditor } from './entities/Auditor'
import { ReportType } from './entities/ReportType'
import { Report } from './entities/Report'

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
			host: envVars.DB_HOST,
			port: envVars.DB_PORT,
			username: envVars.DB_USER,
			password: envVars.DB_PASSWORD,
			database: envVars.DB_NAME,
			synchronize: false,
			autoLoadEntities: true,
			timezone: 'local'
		}),
		TypeOrmModule.forFeature([
			Business,
			BusinessSize,
			Cohort,
			ConsultorType,
			ContactInformation,
			DocumentType,
			EconomicActivity,
			EducationLevel,
			Expert,
			Gender,
			MarketScope,
			Position,
			ProductStatus,
			Role,
			RolePermission,
			Permission,
			Service,
			StrengtheningArea,
			StrengtheningLevel,
			User,
			Post,
			PostCategory,
			Accompaniment,
			Session,
			SessionStatus,
			SessionPreparationFile,
			Menu,
			Chat,
			ChatMessage,
			SessionActivity,
			SessionActivityResponse,
			SessionAttachment,
			Admin,
			Auditor,
			ReportType,
			Report
		]),
		MailModule,
		RedisModule,
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
		ImageUploadModule,
		AdminModule,
		AuditorModule
	],
	controllers: [],
	providers: []
})

export class AppModule { }
