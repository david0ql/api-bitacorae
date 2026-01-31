import { Injectable } from '@nestjs/common'
import { DynamicDatabaseService } from '../dynamic-database/dynamic-database.service'
import { REQUEST_ATTACHMENT_TYPES } from './request-attachment.constants'

@Injectable()
export class AttachmentHomologationService {
	private homologatedBusinesses = new Set<string>()

	constructor(private readonly dynamicDbService: DynamicDatabaseService) {}

	async homologateIfNeeded(businessName: string) {
		if (!businessName || this.homologatedBusinesses.has(businessName)) return

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			await businessDataSource.query(`
				CREATE TABLE IF NOT EXISTS request_attachment (
					id INT AUTO_INCREMENT PRIMARY KEY,
					request_type VARCHAR(50) NOT NULL,
					request_id INT NOT NULL,
					name VARCHAR(255) NOT NULL,
					file_path TEXT NULL,
					external_path TEXT NULL,
					legacy_source VARCHAR(50) NULL,
					legacy_id INT NULL,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`)

			try {
				await businessDataSource.query(`
					CREATE INDEX request_type_request_id ON request_attachment (request_type, request_id)
				`)
			} catch (e) {
				// Index already exists
			}

			try {
				await businessDataSource.query(`
					CREATE UNIQUE INDEX legacy_source_legacy_id ON request_attachment (legacy_source, legacy_id)
				`)
			} catch (e) {
				// Index already exists
			}

			await businessDataSource.query(`
				INSERT INTO request_attachment (request_type, request_id, name, file_path, external_path, legacy_source, legacy_id)
				SELECT
					'${REQUEST_ATTACHMENT_TYPES.BUSINESS_EVIDENCE}',
					b.id,
					SUBSTRING_INDEX(b.evidence, '/', -1) AS name,
					CASE
						WHEN b.evidence LIKE 'http%' THEN NULL
						ELSE b.evidence
					END AS file_path,
					CASE
						WHEN b.evidence LIKE 'http%' THEN b.evidence
						ELSE NULL
					END AS external_path,
					'${REQUEST_ATTACHMENT_TYPES.BUSINESS_EVIDENCE}',
					b.id
				FROM business b
				WHERE b.evidence IS NOT NULL
					AND b.evidence <> ''
					AND NOT EXISTS (
						SELECT 1 FROM request_attachment ra
						WHERE ra.request_type = '${REQUEST_ATTACHMENT_TYPES.BUSINESS_EVIDENCE}'
							AND ra.request_id = b.id
					)
			`)

			await businessDataSource.query(`
				INSERT INTO request_attachment (request_type, request_id, name, file_path, external_path, legacy_source, legacy_id)
				SELECT
					'${REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT}',
					sa.session_id,
					sa.name,
					sa.file_path,
					sa.external_path,
					'${REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT}',
					sa.id
				FROM session_attachment sa
				WHERE NOT EXISTS (
					SELECT 1 FROM request_attachment ra
					WHERE ra.legacy_source = '${REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT}'
						AND ra.legacy_id = sa.id
				)
				AND NOT EXISTS (
					SELECT 1 FROM request_attachment ra
					WHERE ra.request_type = '${REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT}'
						AND ra.request_id = sa.session_id
						AND (
							(ra.file_path IS NOT NULL AND sa.file_path IS NOT NULL AND ra.file_path = sa.file_path)
							OR (ra.external_path IS NOT NULL AND sa.external_path IS NOT NULL AND ra.external_path = sa.external_path)
						)
				)
			`)

			await businessDataSource.query(`
				INSERT INTO request_attachment (request_type, request_id, name, file_path, external_path, legacy_source, legacy_id)
				SELECT
					'${REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT}',
					sa.id,
					SUBSTRING_INDEX(sa.attachment_path, '/', -1) AS name,
					CASE
						WHEN sa.attachment_path LIKE 'http%' THEN NULL
						ELSE sa.attachment_path
					END AS file_path,
					CASE
						WHEN sa.attachment_path LIKE 'http%' THEN sa.attachment_path
						ELSE NULL
					END AS external_path,
					'${REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT}',
					sa.id
				FROM session_activity sa
				WHERE sa.attachment_path IS NOT NULL
					AND sa.attachment_path <> ''
					AND NOT EXISTS (
						SELECT 1 FROM request_attachment ra
						WHERE ra.legacy_source = '${REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT}'
							AND ra.legacy_id = sa.id
					)
					AND NOT EXISTS (
						SELECT 1 FROM request_attachment ra
						WHERE ra.request_type = '${REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT}'
							AND ra.request_id = sa.id
							AND (
								(ra.file_path IS NOT NULL AND ra.file_path = sa.attachment_path)
								OR (ra.external_path IS NOT NULL AND ra.external_path = sa.attachment_path)
							)
					)
			`)

			this.homologatedBusinesses.add(businessName)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
