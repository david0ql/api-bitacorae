import { Controller, Get, HttpCode, Query } from '@nestjs/common'
import { ExpertService } from './expert.service'

@Controller('public/expert')
export class ExpertPublicController {
	constructor(private readonly expertService: ExpertService) {}

	@Get('bulk-catalogs')
	@HttpCode(200)
	getBulkCatalogs(@Query('bn') token: string) {
		const businessName = this.expertService.resolveBusinessNameFromPublicBulkToken(token)
		return this.expertService.getBulkCatalogs(businessName)
	}
}
