// import { Injectable, UnauthorizedException } from '@nestjs/common'
// import { ExtractJwt, Strategy } from 'passport-jwt'
// import { PassportStrategy } from '@nestjs/passport'
// import { InjectDataSource } from '@nestjs/typeorm'

// import { DataSource } from 'typeorm'

// import { JwtPayload } from '../interfaces/jwt-payload.interface'
// // import { Path, User, UserPath } from '../entities'

// import envVars from 'src/config/env'

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
// 	constructor(
// 		@InjectDataSource(envVars.DB_ALIAS)
// 		private readonly dataSource: DataSource,
// 	) {
// 		super({
// 			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
// 			ignoreExpiration: false,
// 			secretOrKey: envVars.JWT_SECRET
// 		})
// 	}

// 	// async validate(payload: JwtPayload): Promise<any> {
// 	// 	const { id } = payload

// 	// 	const user = await this.userRepository.findOne({
// 	// 		where: { id },
// 	// 	})

// 	// 	if (!user) {
// 	// 		throw new UnauthorizedException('User not found')
// 	// 	}

// 	// 	const userPaths = await this.userPathRepository.find({
// 	// 	where: { user_id: id },
// 	// 	})

// 	// 	const paths = await Promise.all(
// 	// 	userPaths.map(async (userPath) => {
// 	// 		const path = await this.pathRepository.findOne({
// 	// 		where: { id: userPath.path_id },
// 	// 		})
// 	// 		return path
// 	// 	}),
// 	// 	)

// 	// 	return {
// 	// 	paths,
// 	// 	user: user.name,
// 	// 	}
// 	// }
// }
