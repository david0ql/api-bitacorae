import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { join } from 'path'

import { AppModule } from './app.module'

import envVars from './config/env'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

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
