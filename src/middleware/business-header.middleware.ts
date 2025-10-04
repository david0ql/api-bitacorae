import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class BusinessHeaderMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const businessName = req.headers['x-business-name'] as string
		const businessPlainName = req.headers['x-business-plain-name'] as string
		
		console.log('🔍 [MIDDLEWARE] Headers recibidos:')
		console.log('  - x-business-name:', businessName)
		console.log('  - x-business-plain-name:', businessPlainName)
		
		if (businessName) {
			// Store the business name in the request object for later use
			req['businessName'] = businessName
			console.log('🔍 [MIDDLEWARE] businessName guardado en request:', businessName)
		}
		
		if (businessPlainName) {
			// Store the business plain name in the request object for later use
			req['businessPlainName'] = businessPlainName
			console.log('🔍 [MIDDLEWARE] businessPlainName guardado en request:', businessPlainName)
		}
		
		next()
	}
} 