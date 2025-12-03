"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Package, Scale, Calculator, User } from "lucide-react"
import type { Bill } from "@/lib/types"

interface MultiFarmerBillViewerProps {
  bill: Bill
}

export function MultiFarmerBillViewer({ bill }: MultiFarmerBillViewerProps) {
  return (
    <div className="space-y-6">
      {/* Bill Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Multi-Farmer Bill - {bill.invoiceId}
              </CardTitle>
              <CardDescription>
                Buyer: {bill.buyerName} | Commodity: {bill.commodityName}
              </CardDescription>
            </div>
            <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
              {bill.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Rate per 100kg</p>
              <p className="text-lg font-semibold">₹{bill.ratePer100Kg.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Farmers</p>
              <p className="text-lg font-semibold">{bill.farmers?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Default Deduction</p>
              <p className="text-lg font-semibold">{bill.defaultDeductionPerBag} kg/bag</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farmers Details */}
      {bill.farmers?.map((farmer, index) => (
        <Card key={farmer._id} className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              {farmer.name}
            </CardTitle>
            <CardDescription>
              {farmer.bags.length} bags | {farmer.totalAdjustedWeight} kg adjusted weight
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Farmer Summary */}
            <div className="grid md:grid-cols-4 gap-4 mb-4 p-3 bg-green-50 rounded">
              <div className="text-center">
                <p className="text-sm text-gray-600">Bags</p>
                <p className="font-semibold">{farmer.bags.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Original Weight</p>
                <p className="font-semibold">{farmer.totalOriginalWeight} kg</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Adjusted Weight</p>
                <p className="font-semibold">{farmer.totalAdjustedWeight} kg</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Farmer Amount</p>
                <p className="font-semibold text-green-600">₹{farmer.farmerAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Farmer's Bags */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag #</TableHead>
                  <TableHead>Original Weight</TableHead>
                  <TableHead>Deduction</TableHead>
                  <TableHead>Adjusted Weight</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmer.bags.map((bag) => (
                  <TableRow key={bag._id}>
                    <TableCell className="font-medium">{bag.bagNumber}</TableCell>
                    <TableCell>{bag.originalWeight} kg</TableCell>
                    <TableCell>{bag.deductionKg} kg</TableCell>
                    <TableCell className="font-medium">{bag.adjustedWeight} kg</TableCell>
                    <TableCell>{bag.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Bill Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Bill Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Total Bags</p>
              <p className="text-2xl font-bold text-blue-600">{bill.totalBagsCount}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <p className="text-sm text-gray-600">Original Weight</p>
              <p className="text-2xl font-bold text-orange-600">{bill.totalOriginalWeight} kg</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Adjusted Weight</p>
              <p className="text-2xl font-bold text-green-600">{bill.totalAdjustedWeight} kg</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-purple-600">₹{bill.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Amount:</span>
              <span className="font-semibold">₹{bill.totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="space-y-2 text-sm border-t pt-4">
              <h4 className="font-medium">Deductions:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span>Commission ({bill.deductions.commissionType}):</span>
                  <span>₹{bill.deductions.commission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>₹{bill.deductions.transport.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labour:</span>
                  <span>₹{bill.deductions.labour.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span>₹{bill.deductions.loading.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weighing:</span>
                  <span>₹{bill.deductions.weighing.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Miscellaneous:</span>
                  <span>₹{bill.deductions.misc.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Final Payable Amount:</span>
                <span className="text-green-600">₹{bill.finalPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}