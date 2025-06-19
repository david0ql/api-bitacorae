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
			const globalDataRaw = await businessDataSource.query(`
				WITH RECURSIVE month_series AS (
					SELECT DATE_FORMAT(
						(SELECT LEAST(
							MIN(DATE(s.start_datetime)),
							MIN(DATE(b.created_at))
						) FROM session s, business b),
						'%Y-%m-01'
					) AS month
					UNION ALL
					SELECT DATE_FORMAT(DATE_ADD(month, INTERVAL 1 MONTH), '%Y-%m-01')
					FROM month_series
					WHERE month < DATE_FORMAT(
						(SELECT GREATEST(
							MAX(DATE(s.start_datetime)),
							MAX(DATE(b.created_at))
						) FROM session s, business b),
						'%Y-%m-01'
					)
				),
				sesiones_por_mes AS (
					SELECT
						DATE_FORMAT(start_datetime, '%Y-%m-01') AS month,
						COUNT(DISTINCT id) AS total_sesiones,
						SUM(TIMESTAMPDIFF(MINUTE, start_datetime, end_datetime)) / 60 AS total_horas
					FROM session
					GROUP BY DATE_FORMAT(start_datetime, '%Y-%m-01')
				),
				empresas_por_mes AS (
					SELECT
						DATE_FORMAT(created_at, '%Y-%m-01') AS month,
						COUNT(DISTINCT id) AS total_empresas
					FROM business
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
			`)
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

			return {
				chartData1,
				chartData2,
				chartData3: result3,
				chartData4
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
