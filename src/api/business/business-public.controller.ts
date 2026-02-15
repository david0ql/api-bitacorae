import { Controller, Get, HttpCode, Query } from '@nestjs/common'
import { BusinessService } from './business.service'

@Controller('public/business')
export class BusinessPublicController {
	constructor(private readonly businessService: BusinessService) {}

	@Get('bulk-catalogs')
	@HttpCode(200)
	getBulkCatalogs(@Query('bn') token: string) {
		const businessName = this.businessService.resolveBusinessNameFromPublicBulkToken(token)
		return this.businessService.getBulkCatalogs(businessName)
	}
}
