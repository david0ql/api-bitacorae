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
			const [
				dataBusiness,
				activeBusiness,
				sessionHours,
				businessSizeRaw,
				platformData,
				cohorts,
				economicSectorsRaw,
				strengtheningAreasRaw,
				productStatusesRaw,
				marketScopesRaw,
				positionsRaw,
				educationLevelsRaw,
				gendersRaw,
				experienceRangesRaw,
				dateRange
			] = await Promise.all([
				businessDataSource.query(`
					SELECT
						COUNT(b.id) AS business_count,
						SUM(b.assigned_hours) totalHours
					FROM
						business b
				`),
				businessDataSource.query(`
					SELECT
						COUNT(DISTINCT b.id) AS business_active_count
					FROM
						business b
						INNER JOIN accompaniment a ON a.business_id = b.id
				`),
				businessDataSource.query(`
					SELECT
						IFNULL(ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)), 0) AS completedHours
					FROM
						session s
				`),
				businessDataSource.query(`
					SELECT
						bs.name AS name,
						COUNT(*) AS value 
					FROM
						business b
						INNER JOIN business_size bs ON b.business_size_id = bs.id
					GROUP BY bs.id
				`),
				businessDataSource.query(`SELECT program_start_date FROM platform LIMIT 1`),
				businessDataSource.query(`SELECT id, name, start_date, end_date FROM cohort c ORDER BY c.order`),
				businessDataSource.query(`
					SELECT
						ea.name AS name,
						COUNT(DISTINCT b.id) AS value 
					FROM
						business b
						INNER JOIN business_economic_activity_rel bea ON bea.business_id = b.id
						INNER JOIN economic_activity ea ON ea.id = bea.economic_activity_id
					GROUP BY ea.id, ea.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
					SELECT
						sa.name AS name,
						COUNT(DISTINCT b.id) AS value 
					FROM
						business b
						INNER JOIN business_strengthening_area_rel bsa ON bsa.business_id = b.id
						INNER JOIN strengthening_area sa ON sa.id = bsa.strengthening_area_id
					GROUP BY sa.id, sa.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
					SELECT
						ps.name AS name,
						COUNT(DISTINCT b.id) AS value 
					FROM
						business b
						INNER JOIN product_status ps ON ps.id = b.product_status_id
					GROUP BY ps.id, ps.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
					SELECT
						ms.name AS name,
						COUNT(DISTINCT b.id) AS value 
					FROM
						business b
						INNER JOIN market_scope ms ON ms.id = b.market_scope_id
					GROUP BY ms.id, ms.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
					SELECT
						ct.name AS name,
						COUNT(DISTINCT e.id) AS expert_count,
						SUM(a.total_hours) AS total_hours,
						COUNT(DISTINCT b.id) AS business_count
					FROM
						expert e
						INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
						INNER JOIN accompaniment a ON a.expert_id = e.id
						INNER JOIN business b ON b.id = a.business_id
					GROUP BY ct.id, ct.name
					ORDER BY expert_count DESC
				`),
				businessDataSource.query(`
					SELECT
						el.name AS name,
						COUNT(DISTINCT ci.id) AS value 
					FROM
						contact_information ci
						INNER JOIN education_level el ON el.id = ci.education_level_id
					GROUP BY el.id, el.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
					SELECT
						g.name AS name,
						COUNT(DISTINCT ci.id) AS value 
					FROM
						contact_information ci
						INNER JOIN gender g ON g.id = ci.gender_id
					GROUP BY g.id, g.name
					ORDER BY value DESC
				`),
				businessDataSource.query(`
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
				`),
				businessDataSource.query(`
					SELECT 
						LEAST(
							COALESCE((SELECT MIN(DATE(start_datetime)) FROM session WHERE start_datetime IS NOT NULL), '2024-01-01'),
							COALESCE((SELECT MIN(DATE(created_at)) FROM business WHERE created_at IS NOT NULL), '2024-01-01')
						) AS min_date,
						GREATEST(
							COALESCE((SELECT MAX(DATE(start_datetime)) FROM session WHERE start_datetime IS NOT NULL), '2024-12-31'),
							COALESCE((SELECT MAX(DATE(created_at)) FROM business WHERE created_at IS NOT NULL), '2024-12-31')
						) AS max_date
				`)
			])

			// Calculate percentage safely
			const assignedHours = dataBusiness[0].totalHours || 0
			const completedHours = sessionHours[0].completedHours || 0
			const percentage = assignedHours > 0 
				? Math.round((completedHours / assignedHours) * 100)
				: 0

			const chartData1 = {
				business_count: dataBusiness[0].business_count,
				business_active_count: activeBusiness[0].business_active_count,
				assigned_hours: assignedHours,
				session_hours_completed: completedHours,
				percentage: percentage
			}
	//*********** */
			const businessSize = businessSizeRaw.map((item) => {
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
			// Get platform program start date
			const programStartDate = platformData[0]?.program_start_date || '2025-02-01' // Default fallback

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

				`, [programStartDate, cohort.end_date, cohort.id, cohort.id])

				const categories = data.map((d: any) => d.month)
				const hours = data.map((d: any) => Number(d.total_horas) || 0)
				const sessions = data.map((d: any) => Number(d.total_sesiones) || 0)
				const businesses = data.map((d: any) => Number(d.total_empresas) || 0)

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

			console.log('chartData3 debug:', {
				cohorts: cohorts,
				data: result3
			})

			const chartData3 = {
				cohorts: cohorts,
				data: result3
			}
	//*********** */
			// Obtener fechas mínimas y máximas para el rango
			const minDate = dateRange[0]?.min_date || '2024-01-01'
			const maxDate = dateRange[0]?.max_date || '2024-12-31'
			
			console.log('Date range debug:', { minDate, maxDate })
			
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
			
			console.log('globalDataRaw debug:', globalDataRaw)
			
			const categories4 = globalDataRaw.map((d: any) => d.month)
			const hours4 = globalDataRaw.map((d: any) => Number(d.total_horas) || 0)
			const sessions4 = globalDataRaw.map((d: any) => Number(d.total_sesiones) || 0)
			const businesses4 = globalDataRaw.map((d: any) => Number(d.total_empresas) || 0)
			const totalHours4 = hours4.reduce((acc, cur) => acc + Number(cur), 0)
			const totalSessions4 = sessions4.reduce((acc, cur) => acc + Number(cur), 0)
			const totalBusinesses4 = businesses4.reduce((acc, cur) => acc + Number(cur), 0)

			console.log('chartData4 debug:', {
				categories: categories4,
				hours: hours4,
				sessions: sessions4,
				businesses: businesses4,
				totalHours: totalHours4,
				totalSessions: totalSessions4,
				totalBusinesses: totalBusinesses4
			})

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
			const economicSectors = economicSectorsRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Áreas de experticia
			const strengtheningAreas = strengtheningAreasRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Estados de producto
			const productStatuses = productStatusesRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Alcance de mercado
			const marketScopes = marketScopesRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Tipos de consultores/expertos
			const positions = positionsRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.expert_count),
					total_hours: parseInt(item.total_hours) || 0,
					business_count: parseInt(item.business_count)
				}
			})

			//*********** */
			// Niveles de educación
			const educationLevels = educationLevelsRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Géneros
			const genders = gendersRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			//*********** */
			// Experiencia por rangos
			const experienceRanges = experienceRangesRaw.map((item) => {
				return {
					name: item.name,
					value: parseInt(item.value)
				}
			})

			return {
				chartData1,
				chartData2,
				chartData3,
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
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
