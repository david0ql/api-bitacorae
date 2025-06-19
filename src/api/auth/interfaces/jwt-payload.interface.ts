export interface JwtPayload {
	id: number;
	roleId: number;
	email: string;
	businessName: string;
	iat?: number;
	exp?: number;
}
