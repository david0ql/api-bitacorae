import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { RedisModule } from './services/redis/redis.module';
import { AuthModule } from './api/auth/auth.module';
import { BusinessModule } from './api/business/business.module';
import { BusinessSizeModule } from './api/business-size/business-size.module';
import { CohortModule } from './api/cohort/cohort.module';
import { ConsultorTypeModule } from './api/consultor-type/consultor-type.module';
import { ContactInformationModule } from './api/contact-information/contact-information.module';
import { DocumentTypeModule } from './api/document-type/document-type.module';
import { EconomicActivityModule } from './api/economic-activity/economic-activity.module';
import { EducationLevelModule } from './api/education-level/education-level.module';
import { ExpertModule } from './api/expert/expert.module';
import { GenderModule } from './api/gender/gender.module';
import { MarketScopeModule } from './api/market-scope/market-scope.module';
import { PositionModule } from './api/position/position.module';
import { ProductoStatusModule } from './api/producto-status/producto-status.module';
import { RoleModule } from './api/role/role.module';
import { ServiceModule } from './api/service/service.module';
import { StrengtheningAreaModule } from './api/strengthening_area/strengthening_area.module';
import { StrengtheningLevelModule } from './api/strengthening_level/strengthening_level.module';
import { UserModule } from './api/user/user.module';
import { PostModule } from './api/post/post.module';
import { PostCategoryModule } from './api/post-category/post-category.module';

import { Business } from 'src/entities/Business';
import { BusinessSize } from './entities/BusinessSize';
import { Cohort } from './entities/Cohort';
import { ConsultorType } from './entities/ConsultorType';
import { ContactInformation } from 'src/entities/ContactInformation';
import { DocumentType } from 'src/entities/DocumentType';
import { EconomicActivity } from 'src/entities/EconomicActivity';
import { EducationLevel } from 'src/entities/EducationLevel';
import { Expert } from 'src/entities/Expert';
import { Gender } from 'src/entities/Gender';
import { MarketScope } from './entities/MarketScope';
import { Position } from './entities/Position';
import { ProductStatus } from './entities/ProductStatus';
import { Role } from 'src/entities/Role';
import { RolePermission } from './entities/RolePermission';
import { Permission } from './entities/Permission';
import { Service } from './entities/Service';
import { StrengtheningArea } from 'src/entities/StrengtheningArea';
import { StrengtheningLevel } from './entities/StrengtheningLevel';
import { User } from 'src/entities/User';
import { Post } from './entities/Post';
import { PostCategory } from './entities/PostCategory';
import { Accompaniment } from './entities/Accompaniment';
import { Session } from './entities/Session';
import { SessionStatus } from './entities/SessionStatus';
import { SessionPreparationFile } from './entities/SessionPreparationFile';

import envVars from './config/env';
import { AccompanimentModule } from './api/accompaniment/accompaniment.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: envVars.DB_HOST,
			port: envVars.DB_PORT,
			username: envVars.DB_USER,
			password: envVars.DB_PASSWORD,
			database: envVars.DB_NAME,
			synchronize: false,
			autoLoadEntities: true,
			timezone: 'Z'
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
			SessionPreparationFile
		]),
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
		ProductoStatusModule,
		RoleModule,
		ServiceModule,
		StrengtheningAreaModule,
		StrengtheningLevelModule,
		UserModule,
		PostModule,
		PostCategoryModule,
		AccompanimentModule
	],
	controllers: [],
	providers: []
})

export class AppModule { }
