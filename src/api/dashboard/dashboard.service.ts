import { Injectable } from '@nestjs/common'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

@Injectable()
export class DashboardService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const dataBusiness = await businessDataSource.query(`
				SELECT
					COUNT(b.id) AS business_count,
					SUM(b.assigned_hours) totalHours
				FROM
					business b
			`)
			const activeBusiness = await businessDataSource.query(`
				SELECT
					COUNT(DISTINCT b.id) AS business_active_count
				FROM
					business b
					INNER JOIN accompaniment a ON a.business_id = b.id
			`)
			const sessionHours = await businessDataSource.query(`
				SELECT
					IFNULL(ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)), 0) AS completedHours
				FROM
					session s
			`)
			const chartData1 = {
				business_count: dataBusiness[0].business_count,
				business_active_count: activeBusiness[0].business_active_count,
				assigned_hours: dataBusiness[0].totalHours,
				session_hours_completed: sessionHours[0].completedHours,
				percentage: Math.round(sessionHours[0].completedHours / dataBusiness[0].totalHours * 100) || 0
			}
	//*********** */
			const businessSize = (await businessDataSource.query(`
				SELECT
					bs.name AS name,
					COUNT(*) AS value 
				FROM
					business b
					INNER JOIN business_size bs ON b.business_size_id = bs.id
				GROUP BY bs.id
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})
			const chartData2 = {
				business_size: businessSize,
				total: businessSize.reduce((acc, curr) => acc + curr.value, 0)
			}
	//*********** */
			const cohorts = await businessDataSource.query(`SELECT id, name, start_date, end_date FROM cohort c ORDER BY c.order`)
			let result3 = await Promise.all(cohorts.map(async cohort => {
				const data = await businessDataSource.query(`
					WITH RECURSIVE month_series AS (
						SELECT DATE_FORMAT(? , '%Y-%m-01') AS month
						UNION ALL
						SELECT DATE_FORMAT(DATE_ADD(month, INTERVAL 1 MONTH), '%Y-%m-01')
						FROM month_series
						WHERE month < DATE_FORMAT(?, '%Y-%m-01')
					),
					empresas_por_mes AS (
						SELECT
							DATE_FORMAT(b.created_at, '%Y-%m-01') AS month,
							COUNT(DISTINCT b.id) AS total_empresas
						FROM business b
						WHERE b.cohort_id = ?
						GROUP BY DATE_FORMAT(b.created_at, '%Y-%m-01')
					),
					sesiones_por_mes AS (
						SELECT
							DATE_FORMAT(s.start_datetime, '%Y-%m-01') AS month,
							COUNT(DISTINCT s.id) AS total_sesiones,
							SUM(TIMESTAMPDIFF(MINUTE, s.start_datetime, s.end_datetime)) / 60 AS total_horas
						FROM session s
						INNER JOIN accompaniment a ON a.id = s.accompaniment_id
						INNER JOIN business b ON b.id = a.business_id
						WHERE b.cohort_id = ?
						GROUP BY DATE_FORMAT(s.start_datetime, '%Y-%m-01')
					)

					SELECT
						DATE_FORMAT(m.month, '%b/%Y') AS month,
						IFNULL(s.total_sesiones, 0) AS total_sesiones,
						IFNULL(s.total_horas, 0) AS total_horas,
						IFNULL(b.total_empresas, 0) AS total_empresas
					FROM month_series m
					LEFT JOIN sesiones_por_mes s ON s.month = m.month
					LEFT JOIN empresas_por_mes b ON b.month = m.month
					ORDER BY m.month

				`, [cohort.start_date, cohort.end_date, cohort.id, cohort.id])

				const categories = data.map((d: any) => d.month)

				const hours = categories.map(month => {
					const entry = data.find((d: any) => d.month === month)
					return entry ? entry.total_horas : 0
				})
				const sessions = categories.map(month => {
					const entry = data.find((d: any) => d.month === month)
					return entry ? entry.total_sesiones : 0
				})
				const businesses = categories.map(month => {
					const entry = data.find((d: any) => d.month === month)
					return entry ? entry.total_empresas : 0
				})

				const totalHours = hours.reduce((acc, cur) => acc + Number(cur), 0)
				const totalSessions = sessions.reduce((acc, cur) => acc + Number(cur), 0)
				const totalBusinesses = businesses.reduce((acc, cur) => acc + Number(cur), 0)

				return {
					[cohort.id]: {
						categories,
						hours,
						sessions,
						businesses,
						totalHours,
						totalSessions,
						totalBusinesses
					}
				}
			}))
			result3 = result3.reduce((acc, curr) => {
				const id = Object.keys(curr)[0]
				return {
					...acc,
					[id]: curr[id]
				}
			}, {})
	//*********** */
			// Obtener fechas mínimas y máximas para el rango
			const dateRange = await businessDataSource.query(`
				SELECT 
					LEAST(
						COALESCE(MIN(DATE(s.start_datetime)), '2024-01-01'),
						COALESCE(MIN(DATE(b.created_at)), '2024-01-01')
					) AS min_date,
					GREATEST(
						COALESCE(MAX(DATE(s.start_datetime)), '2024-12-31'),
						COALESCE(MAX(DATE(b.created_at)), '2024-12-31')
					) AS max_date
				FROM session s, business b
			`)
			
			const minDate = dateRange[0]?.min_date || '2024-01-01'
			const maxDate = dateRange[0]?.max_date || '2024-12-31'
			
			const globalDataRaw = await businessDataSource.query(`
				WITH RECURSIVE month_series AS (
					SELECT DATE_FORMAT(?, '%Y-%m-01') AS month
					UNION ALL
					SELECT DATE_FORMAT(DATE_ADD(month, INTERVAL 1 MONTH), '%Y-%m-01')
					FROM month_series
					WHERE month < DATE_FORMAT(?, '%Y-%m-01')
				),
				sesiones_por_mes AS (
					SELECT
						DATE_FORMAT(start_datetime, '%Y-%m-01') AS month,
						COUNT(DISTINCT id) AS total_sesiones,
						SUM(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime)) / 60 AS total_horas
					FROM session
					WHERE start_datetime IS NOT NULL
					GROUP BY DATE_FORMAT(start_datetime, '%Y-%m-01')
				),
				empresas_por_mes AS (
					SELECT
						DATE_FORMAT(created_at, '%Y-%m-01') AS month,
						COUNT(DISTINCT id) AS total_empresas
					FROM business
					WHERE created_at IS NOT NULL
					GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
				)

				SELECT
					DATE_FORMAT(m.month, '%b/%Y') AS month,
					IFNULL(s.total_sesiones, 0) AS total_sesiones,
					IFNULL(s.total_horas, 0) AS total_horas,
					IFNULL(b.total_empresas, 0) AS total_empresas
				FROM month_series m
				LEFT JOIN sesiones_por_mes s ON s.month = m.month
				LEFT JOIN empresas_por_mes b ON b.month = m.month
				ORDER BY m.month
			`, [minDate, maxDate])
			const categories4 = globalDataRaw.map((d: any) => d.month)
			const hours4 = categories4.map(month => {
				const entry = globalDataRaw.find((d: any) => d.month === month)
				return entry ? entry.total_horas : 0
			})
			const sessions4 = categories4.map(month => {
				const entry = globalDataRaw.find((d: any) => d.month === month)
				return entry ? entry.total_sesiones : 0
			})
			const businesses4 = categories4.map(month => {
				const entry = globalDataRaw.find((d: any) => d.month === month)
				return entry ? entry.total_empresas : 0
			})
			const totalHours4 = hours4.reduce((acc, cur) => acc + Number(cur), 0)
			const totalSessions4 = sessions4.reduce((acc, cur) => acc + Number(cur), 0)
			const totalBusinesses4 = businesses4.reduce((acc, cur) => acc + Number(cur), 0)

			const chartData4 = {
				categories: categories4,
				hours: hours4,
				sessions: sessions4,
				businesses: businesses4,
				totalHours: totalHours4,
				totalSessions: totalSessions4,
				totalBusinesses: totalBusinesses4
			}

			//*********** */
			// Sectores económicos
			const economicSectors = (await businessDataSource.query(`
				SELECT
					ea.name AS name,
					COUNT(DISTINCT b.id) AS value 
				FROM
					business b
					INNER JOIN business_economic_activity_rel bea ON bea.business_id = b.id
					INNER JOIN economic_activity ea ON ea.id = bea.economic_activity_id
				GROUP BY ea.id, ea.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Áreas de experticia
			const strengtheningAreas = (await businessDataSource.query(`
				SELECT
					sa.name AS name,
					COUNT(DISTINCT b.id) AS value 
				FROM
					business b
					INNER JOIN business_strengthening_area_rel bsa ON bsa.business_id = b.id
					INNER JOIN strengthening_area sa ON sa.id = bsa.strengthening_area_id
				GROUP BY sa.id, sa.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Estados de producto
			const productStatuses = (await businessDataSource.query(`
				SELECT
					ps.name AS name,
					COUNT(DISTINCT b.id) AS value 
				FROM
					business b
					INNER JOIN product_status ps ON ps.id = b.product_status_id
				GROUP BY ps.id, ps.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Alcance de mercado
			const marketScopes = (await businessDataSource.query(`
				SELECT
					ms.name AS name,
					COUNT(DISTINCT b.id) AS value 
				FROM
					business b
					INNER JOIN market_scope ms ON ms.id = b.market_scope_id
				GROUP BY ms.id, ms.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Posiciones/cargos
			const positions = (await businessDataSource.query(`
				SELECT
					p.name AS name,
					COUNT(DISTINCT b.id) AS value 
				FROM
					business b
					INNER JOIN position p ON p.id = b.position_id
				GROUP BY p.id, p.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Niveles de educación
			const educationLevels = (await businessDataSource.query(`
				SELECT
					el.name AS name,
					COUNT(DISTINCT ci.id) AS value 
				FROM
					contact_information ci
					INNER JOIN education_level el ON el.id = ci.education_level_id
				GROUP BY el.id, el.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Géneros
			const genders = (await businessDataSource.query(`
				SELECT
					g.name AS name,
					COUNT(DISTINCT ci.id) AS value 
				FROM
					contact_information ci
					INNER JOIN gender g ON g.id = ci.gender_id
				GROUP BY g.id, g.name
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Experiencia por rangos
			const experienceRanges = (await businessDataSource.query(`
				SELECT
					CASE 
						WHEN ci.experience_years < 2 THEN '0-2 años'
						WHEN ci.experience_years BETWEEN 2 AND 5 THEN '2-5 años'
						WHEN ci.experience_years BETWEEN 5 AND 10 THEN '5-10 años'
						WHEN ci.experience_years > 10 THEN 'Más de 10 años'
						ELSE 'No especificado'
					END AS name,
					COUNT(DISTINCT ci.id) AS value 
				FROM
					contact_information ci
				GROUP BY 
					CASE 
						WHEN ci.experience_years < 2 THEN '0-2 años'
						WHEN ci.experience_years BETWEEN 2 AND 5 THEN '2-5 años'
						WHEN ci.experience_years BETWEEN 5 AND 10 THEN '5-10 años'
						WHEN ci.experience_years > 10 THEN 'Más de 10 años'
						ELSE 'No especificado'
					END
				ORDER BY value DESC
			`)).map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			return {
				chartData1,
				chartData2,
				chartData3: result3,
				chartData4,
				economicSectors: {
					data: economicSectors,
					total: economicSectors.reduce((acc, curr) => acc + curr.value, 0)
				},
				strengtheningAreas: {
					data: strengtheningAreas,
					total: strengtheningAreas.reduce((acc, curr) => acc + curr.value, 0)
				},
				productStatuses: {
					data: productStatuses,
					total: productStatuses.reduce((acc, curr) => acc + curr.value, 0)
				},
				marketScopes: {
					data: marketScopes,
					total: marketScopes.reduce((acc, curr) => acc + curr.value, 0)
				},
				positions: {
					data: positions,
					total: positions.reduce((acc, curr) => acc + curr.value, 0)
				},
				educationLevels: {
					data: educationLevels,
					total: educationLevels.reduce((acc, curr) => acc + curr.value, 0)
				},
				genders: {
					data: genders,
					total: genders.reduce((acc, curr) => acc + curr.value, 0)
				},
				experienceRanges: {
					data: experienceRanges,
					total: experienceRanges.reduce((acc, curr) => acc + curr.value, 0)
				}
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
