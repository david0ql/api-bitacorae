import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const BusinessName = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		return request.businessName
	}
) 