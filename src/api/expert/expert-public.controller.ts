import { Controller, Get, HttpCode, Query } from '@nestjs/common'
import { ExpertService } from './expert.service'

@Controller('public/expert')
export class ExpertPublicController {
	constructor(private readonly expertService: ExpertService) {}

	@Get('bulk-catalogs')
	@HttpCode(200)
	async getBulkCatalogs(@Query('bn') token: string) {
		const { businessName, exp } = this.expertService.resolvePublicBulkToken(token)
		const catalogs = await this.expertService.getBulkCatalogs(businessName)
		return {
			...catalogs,
			tokenExp: exp
		}
	}
}
