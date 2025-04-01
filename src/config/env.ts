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
