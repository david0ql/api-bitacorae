import { Controller, Get, HttpCode, Query } from '@nestjs/common'
import { BusinessService } from './business.service'

@Controller('public/business')
export class BusinessPublicController {
	constructor(private readonly businessService: BusinessService) {}

	@Get('bulk-catalogs')
	@HttpCode(200)
	async getBulkCatalogs(@Query('bn') token: string) {
		const { businessName, exp } = this.businessService.resolvePublicBulkToken(token)
		const catalogs = await this.businessService.getBulkCatalogs(businessName)
		return {
			...catalogs,
			tokenExp: exp
		}
	}
}
