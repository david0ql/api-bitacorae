export interface JwtPayload {
	id: number;
	roleId: number;
	email: string;
	iat?: number;
	exp?: number;
}
