import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { join } from 'path'

import { AppModule } from './app.module'

import { NestExpressApplication } from '@nestjs/platform-express'
import { json, urlencoded } from 'express'
import envVars from './config/env'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	app.use(json({ limit: '2048mb' })) // 2 GB limit for JSON payloads
	app.use(urlencoded({ extended: true, limit: '2048mb' })) // 2 GB limit for URL-encoded payloads

	app.useGlobalPipes(new ValidationPipe({
		forbidNonWhitelisted: true,
		whitelist: true,
		transform: true
	}))

	app.useStaticAssets(join(__dirname, '..', 'public', 'swagger'), {
		prefix: '/swagger/'
	})

	const config = new DocumentBuilder()
		.setTitle('API Bitacora')
		.setVersion('1.0')
		.addBearerAuth()
		.build()

	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('docs', app, document, {
		customCssUrl: '/swagger/swagger-dark.css'
	})

	app.enableCors()

	await app.listen(envVars.PORT)
}

bootstrap()
