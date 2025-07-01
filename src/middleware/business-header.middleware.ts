import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class BusinessHeaderMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const businessName = req.headers['x-business-name'] as string
		
		if (businessName) {
			// Store the business name in the request object for later use
			req['businessName'] = businessName
		}
		
		next()
	}
} 