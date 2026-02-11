import ExcelJS from 'exceljs'
import { Response } from 'express'

interface TripData {
  id: string
  origin: string
  destination: string
  departure_date: string
  departure_time: string
  capacity: number
  available_seats: number
  price: number
  status: string
  created_at: string
  created_by?: string
}

interface BookingData {
  id: string
  trip_id: string
  status: string
  payment_status: string
  payment_id?: string
  full_name?: string
  phone?: string
  created_at: string
  trip?: TripData
}

interface ExportParams {
  workbook: ExcelJS.Workbook
  title: string
  headers: string[]
  data: Record<string, unknown>[]
  sheetName?: string
}

class ExcelService {
  /**
   * Generate Excel file and send as download
   */
  async exportToResponse(
    res: Response,
    filename: string,
    sheets: { name: string; headers: string[]; data: Record<string, unknown>[] }[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'DaBus Admin'
    workbook.created = new Date()

    for (const sheet of sheets) {
      const worksheet = workbook.addWorksheet(sheet.name)

      // Add title
      worksheet.mergeCells('A1', `${String.fromCharCode(64 + sheet.headers.length)}1`)
      const titleCell = worksheet.getCell('A1')
      titleCell.value = sheet.name
      titleCell.font = { bold: true, size: 16 }
      titleCell.alignment = { horizontal: 'center' }

      // Add export date
      worksheet.mergeCells('A2', `${String.fromCharCode(64 + sheet.headers.length)}2`)
      const dateCell = worksheet.getCell('A2')
      dateCell.value = `Exported: ${new Date().toLocaleString('fr-FR')}`
      dateCell.font = { italic: true, size: 10 }
      dateCell.alignment = { horizontal: 'center' }

      // Add headers starting from row 4
      const headerRow = worksheet.getRow(4)
      sheet.headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { horizontal: 'center' }
        worksheet.getColumn(index + 1).width = 20
      })

      // Add data
      sheet.data.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(5 + rowIndex)
        Object.values(row).forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1)
          cell.value = String(value ?? '')
          cell.alignment = { horizontal: 'left' }
        })
      })
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

    await workbook.xlsx.write(res)
    res.end()
  }

  /**
   * Export trips to Excel
   */
  async exportTrips(
    res: Response,
    trips: TripData[]
  ): Promise<void> {
    const sheets = [
      {
        name: 'Trajets',
        headers: [
          'ID',
          'Origine',
          'Destination',
          'Date',
          'Heure',
          'Capacité',
          'Places',
          'Prix (XOF)',
          'Statut',
          'Créé le'
        ],
        data: trips.map((trip) => ({
          ID: trip.id,
          Origine: trip.origin,
          Destination: trip.destination,
          Date: trip.departure_date,
          Heure: trip.departure_time,
          Capacité: trip.capacity,
          'Places disponibles': trip.available_seats,
          Prix: trip.price,
          Statut: trip.status,
          'Créé le': new Date(trip.created_at).toLocaleString('fr-FR')
        }))
      }
    ]

    const filename = `dabus-trajets-${new Date().toISOString().split('T')[0]}.xlsx`
    await this.exportToResponse(res, filename, sheets)
  }

  /**
   * Export bookings to Excel with user and trip details
   */
  async exportBookings(
    res: Response,
    bookings: BookingData[]
  ): Promise<void> {
    const sheets = [
      {
        name: 'Réservations',
        headers: [
          'ID Réservation',
          'Date création',
          'Client',
          'Email',
          'Téléphone',
          'Trajet',
          'Origine',
          'Destination',
          'Date trajet',
          'Prix (XOF)',
          'Statut paiement',
          'Statut réservation'
        ],
        data: bookings.map((booking) => ({
          'ID Réservation': booking.trip_id,
          'Date création': new Date(booking.created_at).toLocaleString('fr-FR'),
          Client: booking.full_name || 'N/A',
          Email: 'N/A',
          Téléphone: booking.phone || 'N/A',
          Trajet: booking.trip
            ? `${booking.trip.origin} → ${booking.trip.destination}`
            : 'N/A',
          Origine: booking.trip?.origin || 'N/A',
          Destination: booking.trip?.destination || 'N/A',
          'Date trajet': booking.trip?.departure_date || 'N/A',
          Prix: booking.trip?.price || 0,
          'Statut paiement': booking.payment_status,
          'Statut réservation': booking.status
        }))
      }
    ]

    const filename = `dabus-reservations-${new Date().toISOString().split('T')[0]}.xlsx`
    await this.exportToResponse(res, filename, sheets)
  }

  /**
   * Export full report with trips and bookings sheets
   */
  async exportFullReport(
    res: Response,
    trips: TripData[],
    bookings: BookingData[]
  ): Promise<void> {
    const sheets = [
      {
        name: 'Trajets',
        headers: [
          'ID',
          'Origine',
          'Destination',
          'Date',
          'Heure',
          'Capacité',
          'Places',
          'Prix (XOF)',
          'Statut',
          'Créé le'
        ],
        data: trips.map((trip) => ({
          ID: trip.id,
          Origine: trip.origin,
          Destination: trip.destination,
          Date: trip.departure_date,
          Heure: trip.departure_time,
          Capacité: trip.capacity,
          'Places disponibles': trip.available_seats,
          Prix: trip.price,
          Statut: trip.status,
          'Créé le': new Date(trip.created_at).toLocaleString('fr-FR')
        }))
      },
      {
        name: 'Réservations',
        headers: [
          'ID Réservation',
          'Date création',
          'Client',
          'Email',
          'Téléphone',
          'Trajet',
          'Origine',
          'Destination',
          'Date trajet',
          'Prix (XOF)',
          'Statut paiement',
          'Statut réservation'
        ],
        data: bookings.map((booking) => ({
          'ID Réservation': booking.trip_id,
          'Date création': new Date(booking.created_at).toLocaleString('fr-FR'),
          Client: booking.full_name || 'N/A',
          Email: 'N/A',
          Téléphone: booking.phone || 'N/A',
          Trajet: booking.trip
            ? `${booking.trip.origin} → ${booking.trip.destination}`
            : 'N/A',
          Origine: booking.trip?.origin || 'N/A',
          Destination: booking.trip?.destination || 'N/A',
          'Date trajet': booking.trip?.departure_date || 'N/A',
          Prix: booking.trip?.price || 0,
          'Statut paiement': booking.payment_status,
          'Statut réservation': booking.status
        }))
      }
    ]

    const filename = `dabus-rapport-complet-${new Date().toISOString().split('T')[0]}.xlsx`
    await this.exportToResponse(res, filename, sheets)
  }
}

export const excelService = new ExcelService()
