import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, FileText, Users, Package } from "lucide-react"

export default function ViewerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Public Viewer</h1>
          <Link href="/login">
            <Button variant="outline">Admin Login</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome to Public Viewer</h2>
          <p className="text-gray-600 mb-6">Browse all billing information without login. View bills, commodities, and farmer details in read-only mode.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>View Bills</CardTitle>
              <CardDescription>Browse all billing records</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/viewer/bills">
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Bills
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Commodities</CardTitle>
              <CardDescription>View commodity rates and details</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/viewer/commodities">
                <Button className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Commodities
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Farmers</CardTitle>
              <CardDescription>Browse farmer information</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/viewer/farmers">
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Farmers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Bills</p>
                  <p className="text-2xl font-bold text-blue-600">View All</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Commodities</p>
                  <p className="text-2xl font-bold text-green-600">Rates & Info</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Farmers</p>
                  <p className="text-2xl font-bold text-purple-600">Browse All</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Available Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">✅ What You Can View:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete bill details with buyer/seller info</li>
                  <li>• Individual bag weights and adjustments</li>
                  <li>• Commodity rates and deduction rules</li>
                  <li>• Financial breakdowns and calculations</li>
                  <li>• Farmer transaction history</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">🔒 Read-Only Access:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No login required - direct access</li>
                  <li>• Cannot edit or modify any data</li>
                  <li>• Cannot add new bills or commodities</li>
                  <li>• Cannot change rates or settings</li>
                  <li>• Pure viewing and browsing only</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}