import * as joi from 'joi';
import 'dotenv/config';

interface EnvVars {
	DB_HOST_ADMIN: string;
	DB_PORT_ADMIN: number;
	DB_USER_ADMIN: string;
	DB_PASSWORD_ADMIN: string;
	DB_NAME_ADMIN: string;
	DB_ALIAS_ADMIN: string;
	JWT_SECRET: string;
	PORT: number;
	REDIS_HOST: string;
	REDIS_PORT: number;
	UPLOADS_DIR: string;
	APP_URL: string;
	WEB_URL: string;
	MAIL_HOST: string;
	MAIL_PORT: number;
	MAIL_USER: string;
	MAIL_PASSWORD: string;
	MAIL_FROM: string;
	MAIL_FROM_NAME: string;
}

const envSchema = joi
  	.object({
		DB_HOST_ADMIN: joi.string().required(),
		DB_PORT_ADMIN: joi.number().required(),
		DB_USER_ADMIN: joi.string().required(),
		DB_PASSWORD_ADMIN: joi.string().required(),
		DB_NAME_ADMIN: joi.string().required(),
		DB_ALIAS_ADMIN: joi.string().required(),
		JWT_SECRET: joi.string().required(),
		PORT: joi.number().required(),
		REDIS_HOST: joi.string().required(),
		REDIS_PORT: joi.number().required(),
		UPLOADS_DIR: joi.string().required(),
		APP_URL: joi.string().required(),
		WEB_URL: joi.string().required(),
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
