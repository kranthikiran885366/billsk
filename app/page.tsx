import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Database, Users, FileText, BarChart3, Lock } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SecureBill</span>
          </div>
          <div className="space-x-4">
            <Link href="/viewer">
              <Button variant="outline">View Bills</Button>
            </Link>
            <Link href="/login">
              <Button>Admin Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure Commodity Billing System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced multi-farmer billing with enterprise-grade security, zero data loss, 
            and comprehensive audit trails. Built by Mallela Kranthi Kiran.
          </p>
          <div className="space-x-4">
            <Link href="/viewer">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Public Bills
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Admin Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Advanced Security</CardTitle>
                <CardDescription>
                  Fingerprint auth, JWT tokens, rate limiting, and comprehensive audit logs
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Database className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Zero Data Loss</CardTitle>
                <CardDescription>
                  MongoDB replica sets, automated backups, and transaction-safe operations
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Multi-Farmer Support</CardTitle>
                <CardDescription>
                  Handle multiple farmers per buyer with individual bag tracking
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Smart Billing</CardTitle>
                <CardDescription>
                  Rate per 100kg, automatic deductions, and comprehensive calculations
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Detailed insights, export capabilities, and performance metrics
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Lock className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Admin full control, public viewer access without authentication
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Highlights */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Enterprise Security</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Authentication & Access</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Fingerprint biometric authentication</li>
                  <li>• JWT with refresh token rotation</li>
                  <li>• Device fingerprinting & tracking</li>
                  <li>• Brute force protection</li>
                  <li>• Session management</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Data Protection</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• MongoDB replica set clustering</li>
                  <li>• Automated daily backups</li>
                  <li>• Point-in-time recovery</li>
                  <li>• Encrypted data transmission</li>
                  <li>• Comprehensive audit trails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 SecureBill - Developed by Mallela Kranthi Kiran
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Enterprise Commodity Billing System with Advanced Security
          </p>
        </div>
      </footer>
    </div>
  )
}
