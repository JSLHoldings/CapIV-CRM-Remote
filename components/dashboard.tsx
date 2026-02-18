"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Dashboard() {
  const [calculatorData, setCalculatorData] = useState({
    capitalAmount: "",
    timePeriod: "",
    annualRate: "",
  })

  const [calculationResults, setCalculationResults] = useState({
    totalReturn: 0,
    annualROI: 0,
  })

  const handleCalculate = () => {
    const capital = Number.parseFloat(calculatorData.capitalAmount) || 0
    const time = Number.parseFloat(calculatorData.timePeriod) || 0
    const rate = Number.parseFloat(calculatorData.annualRate) || 0

    const totalReturn = capital * Math.pow(1 + rate / 100, time)
    const annualROI = rate

    setCalculationResults({
      totalReturn: totalReturn,
      annualROI: annualROI,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>
      </div>

      {/* Welcome Section */}
      <Card className="bg-muted">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-lg">Welcome Member,</p>
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Sensitivity Analysis */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Sensitivity Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-card border rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                </div>
                <p>Analytics Chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Tools and Documents */}
        <div className="space-y-6">
          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
                Generate LOI
              </Button>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
                Generate NDA
              </Button>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
                Generate OM
              </Button>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
                ROI and IRR Calculator
              </Button>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent">
                Download
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Upload
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="capital">Capital Investment Amount</Label>
              <Input
                id="capital"
                type="number"
                placeholder="Enter amount"
                value={calculatorData.capitalAmount}
                onChange={(e) => setCalculatorData((prev) => ({ ...prev, capitalAmount: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time">Time period</Label>
              <Input
                id="time"
                type="number"
                placeholder="Years"
                value={calculatorData.timePeriod}
                onChange={(e) => setCalculatorData((prev) => ({ ...prev, timePeriod: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rate">Annual rate</Label>
              <Input
                id="rate"
                type="number"
                placeholder="Percentage"
                value={calculatorData.annualRate}
                onChange={(e) => setCalculatorData((prev) => ({ ...prev, annualRate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleCalculate}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium"
            >
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
              Non-Disclosure Agreement
            </Button>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
              Legal Terms and Conditions
            </Button>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium">
              Documents and Information
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${calculationResults.totalReturn.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Annual ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{calculationResults.annualROI.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section with Featured Entity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Featured Entity</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Co-GP
              </Button>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Value-Add
              </Button>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Core
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Card className="bg-card border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Family Wealth Partners</h3>
              <p className="text-muted-foreground">Office</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
