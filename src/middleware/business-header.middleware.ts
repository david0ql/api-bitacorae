import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class BusinessHeaderMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const businessName = req.headers['x-business-name'] as string
		
		console.log('=== BUSINESS HEADER MIDDLEWARE ===')
		console.log('URL:', req.url)
		console.log('Method:', req.method)
		console.log('Business name header:', businessName)
		console.log('All headers:', req.headers)
		console.log('=== END BUSINESS HEADER MIDDLEWARE ===')
		
		if (businessName) {
			// Store the business name in the request object for later use
			req['businessName'] = businessName
		}
		
		next()
	}
} 