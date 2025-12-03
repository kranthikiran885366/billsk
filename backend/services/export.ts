import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { DateWiseReport, FarmerWiseReport, CommodityWiseReport } from './reports'

export class ExportService {
  static async exportToExcel(
    data: DateWiseReport[] | FarmerWiseReport[] | CommodityWiseReport[],
    type: 'date' | 'farmer' | 'commodity'
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`)
    
    // Set headers based on report type
    if (type === 'date') {
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Bills', key: 'totalBills', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 },
        { header: 'Total Weight (Kg)', key: 'totalWeight', width: 20 }
      ]
    } else if (type === 'farmer') {
      worksheet.columns = [
        { header: 'Farmer Name', key: 'farmerName', width: 25 },
        { header: 'Total Bills', key: 'totalBills', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 },
        { header: 'Total Weight (Kg)', key: 'totalWeight', width: 20 }
      ]
    } else {
      worksheet.columns = [
        { header: 'Commodity Name', key: 'commodityName', width: 25 },
        { header: 'Total Bills', key: 'totalBills', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 },
        { header: 'Total Weight (Kg)', key: 'totalWeight', width: 20 }
      ]
    }
    
    // Style headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    
    // Add data
    data.forEach(row => {
      worksheet.addRow(row)
    })
    
    // Format currency columns
    worksheet.getColumn('totalAmount').numFmt = '₹#,##0.00'
    
    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })
    
    return await workbook.xlsx.writeBuffer() as Buffer
  }
  
  static async exportToPDF(
    data: DateWiseReport[] | FarmerWiseReport[] | CommodityWiseReport[],
    type: 'date' | 'farmer' | 'commodity'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []
      
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      
      // Header
      doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' })
      doc.moveDown()
      
      // Table headers
      const headers = type === 'date' 
        ? ['Date', 'Bills', 'Amount (₹)', 'Weight (Kg)']
        : type === 'farmer'
        ? ['Farmer Name', 'Bills', 'Amount (₹)', 'Weight (Kg)']
        : ['Commodity Name', 'Bills', 'Amount (₹)', 'Weight (Kg)']
      
      const startX = 50
      const colWidth = 120
      let y = doc.y
      
      // Draw headers
      doc.fontSize(12).font('Helvetica-Bold')
      headers.forEach((header, i) => {
        doc.text(header, startX + (i * colWidth), y, { width: colWidth, align: 'left' })
      })
      
      y += 20
      doc.moveTo(startX, y).lineTo(startX + (headers.length * colWidth), y).stroke()
      y += 10
      
      // Draw data
      doc.font('Helvetica').fontSize(10)
      data.forEach((row: any) => {
        const values = type === 'date'
          ? [row.date, row.totalBills.toString(), `₹${row.totalAmount.toLocaleString()}`, `${row.totalWeight.toFixed(2)} kg`]
          : type === 'farmer'
          ? [row.farmerName, row.totalBills.toString(), `₹${row.totalAmount.toLocaleString()}`, `${row.totalWeight.toFixed(2)} kg`]
          : [row.commodityName, row.totalBills.toString(), `₹${row.totalAmount.toLocaleString()}`, `${row.totalWeight.toFixed(2)} kg`]
        
        values.forEach((value, i) => {
          doc.text(value, startX + (i * colWidth), y, { width: colWidth, align: 'left' })
        })
        y += 15
        
        // Add new page if needed
        if (y > 700) {
          doc.addPage()
          y = 50
        }
      })
      
      doc.end()
    })
  }
  
  static exportToCSV(
    data: DateWiseReport[] | FarmerWiseReport[] | CommodityWiseReport[],
    type: 'date' | 'farmer' | 'commodity'
  ): string {
    const headers = type === 'date'
      ? ['Date', 'Total Bills', 'Total Amount', 'Total Weight (Kg)']
      : type === 'farmer'
      ? ['Farmer Name', 'Total Bills', 'Total Amount', 'Total Weight (Kg)']
      : ['Commodity Name', 'Total Bills', 'Total Amount', 'Total Weight (Kg)']
    
    const csvRows = [headers.join(',')]
    
    data.forEach((row: any) => {
      const values = type === 'date'
        ? [row.date, row.totalBills, row.totalAmount, row.totalWeight]
        : type === 'farmer'
        ? [row.farmerName, row.totalBills, row.totalAmount, row.totalWeight]
        : [row.commodityName, row.totalBills, row.totalAmount, row.totalWeight]
      
      csvRows.push(values.map(value => `"${value}"`).join(','))
    })
    
    return csvRows.join('\n')
  }
}