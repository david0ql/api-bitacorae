import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

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
import { StrengthingAreaModule } from './api/strengthing_area/strengthing_area.module';
import { StrengthingLevelModule } from './api/strengthing_level/strengthing_level.module';
import { UserModule } from './api/user/user.module';
import { PostModule } from './api/post/post.module';
import { PostCategoryModule } from './api/post-category/post-category.module';

import { BusinessEntity } from 'src/entities/business.entity';
import { BusinessSizeEntity } from './entities/business_size.entity';
import { CohortEntity } from './entities/cohort.entity';
import { ConsultorTypeEntity } from './entities/consultor_type.entity';
import { ContactInformationEntity } from 'src/entities/contact_information.entity';
import { DocumentTypeEntity } from 'src/entities/document_type.entity';
import { EconomicActivityEntity } from 'src/entities/economic_activity.entity';
import { EducationLevelEntity } from 'src/entities/education_level.entity';
import { ExpertEntity } from 'src/entities/expert.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { MarketScopeEntity } from './entities/market_scope.entity';
import { PositionEntity } from './entities/position.entity';
import { ProductStatusEntity } from './entities/product_status.entity';
import { RoleEntity } from 'src/entities/role.entity';
import { ServiceEntity } from './entities/service.entity';
import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity';
import { StrengthingLevelEntity } from './entities/strengthing_level.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PostEntity } from './entities/post.entity';
import { PostCategoryEntity } from './entities/post_category.entity';

import envVars from './config/env';

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
			BusinessEntity,
			BusinessSizeEntity,
			CohortEntity,
			ConsultorTypeEntity,
			ContactInformationEntity,
			DocumentTypeEntity,
			EconomicActivityEntity,
			EducationLevelEntity,
			ExpertEntity,
			GenderEntity,
			MarketScopeEntity,
			PositionEntity,
			ProductStatusEntity,
			RoleEntity,
			ServiceEntity,
			StrengthingAreaEntity,
			StrengthingLevelEntity,
			UserEntity,
			PostEntity,
			PostCategoryEntity
		]),
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
		StrengthingAreaModule,
		StrengthingLevelModule,
		UserModule,
		PostModule,
		PostCategoryModule
	],
	controllers: [],
	providers: []
})

export class AppModule { }
