import * as joi from 'joi';
import 'dotenv/config';

interface EnvVars {
	DB_HOST: string;
	DB_PORT: number;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_NAME: string;
	JWT_SECRET: string;
	PORT: number;
	REDIS_HOST: string;
	REDIS_PORT: number;
	UPLOADS_DIR: string;
	APP_URL: string;
	MAIL_HOST: string;
	MAIL_PORT: number;
	MAIL_USER: string;
	MAIL_PASSWORD: string;
	MAIL_FROM: string;
	MAIL_FROM_NAME: string;
}

const envSchema = joi
  	.object({
		DB_HOST: joi.string().required(),
		DB_PORT: joi.number().required(),
		DB_USER: joi.string().required(),
		DB_PASSWORD: joi.string().required(),
		DB_NAME: joi.string().required(),
		JWT_SECRET: joi.string().required(),
		PORT: joi.number().required(),
		REDIS_HOST: joi.string().required(),
		REDIS_PORT: joi.number().required(),
		UPLOADS_DIR: joi.string().required(),
		APP_URL: joi.string().required(),
		MAIL_HOST: joi.string().required(),
		MAIL_PORT: joi.number().required(),
		MAIL_USER: joi.string().required(),
		MAIL_PASSWORD: joi.string().required(),
		MAIL_FROM: joi.string().required(),
		MAIL_FROM_NAME: joi.string().required()
  	})
	.unknown(true)
	.required()

const { error, value } = envSchema.validate({
  ...process.env
});

if (error) {
  	throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export default envVars;
