"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, TrendingUp } from "lucide-react"

interface ROICalculation {
  totalReturn: number
  annualROI: number
  totalProfit: number
  monthlyReturn: number
  irr: number
}

interface IRRCalculation {
  irr: number
  npv: number
  paybackPeriod: number
  profitabilityIndex: number
}

export function CalculatorTools() {
  const [roiInputs, setRoiInputs] = useState({
    initialInvestment: "",
    finalValue: "",
    timePeriod: "",
    annualCashFlow: "",
  })

  const [irrInputs, setIrrInputs] = useState({
    initialInvestment: "",
    cashFlows: ["", "", "", "", ""],
    discountRate: "10",
  })

  const [roiResults, setRoiResults] = useState<ROICalculation | null>(null)
  const [irrResults, setIrrResults] = useState<IRRCalculation | null>(null)

  const calculateROI = () => {
    const initial = Number.parseFloat(roiInputs.initialInvestment) || 0
    const final = Number.parseFloat(roiInputs.finalValue) || 0
    const time = Number.parseFloat(roiInputs.timePeriod) || 1
    const cashFlow = Number.parseFloat(roiInputs.annualCashFlow) || 0

    const totalReturn = final + cashFlow * time
    const totalProfit = totalReturn - initial
    const annualROI = ((totalReturn / initial) ** (1 / time) - 1) * 100
    const monthlyReturn = totalProfit / (time * 12)

    // Simple IRR approximation
    const irr = ((totalReturn / initial) ** (1 / time) - 1) * 100

    setRoiResults({
      totalReturn,
      annualROI,
      totalProfit,
      monthlyReturn,
      irr,
    })
  }

  const calculateIRR = () => {
    const initial = Number.parseFloat(irrInputs.initialInvestment) || 0
    const cashFlows = irrInputs.cashFlows.map((cf) => Number.parseFloat(cf) || 0)
    const discountRate = Number.parseFloat(irrInputs.discountRate) / 100 || 0.1

    // Simple NPV calculation
    let npv = -initial
    cashFlows.forEach((cf, index) => {
      npv += cf / Math.pow(1 + discountRate, index + 1)
    })

    // Simplified IRR calculation (approximation)
    const totalCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0)
    const irr = ((totalCashFlow / initial) ** (1 / cashFlows.length) - 1) * 100

    // Payback period calculation
    let cumulativeCashFlow = -initial
    let paybackPeriod = 0
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCashFlow += cashFlows[i]
      if (cumulativeCashFlow >= 0) {
        paybackPeriod = i + 1
        break
      }
    }

    const profitabilityIndex = (npv + initial) / initial

    setIrrResults({
      irr,
      npv,
      paybackPeriod,
      profitabilityIndex,
    })
  }

  const generateDocument = (type: string) => {
    // Simulate document generation
    const documents = {
      LOI: "Letter of Intent template generated with current deal parameters.",
      NDA: "Non-Disclosure Agreement template created for confidential deal information.",
      OM: "Offering Memorandum template prepared with investment details and risk disclosures.",
    }

    alert(`${type} Generated!\n\n${documents[type as keyof typeof documents]}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Calculator & Tools</h1>
      </div>

      <Tabs defaultValue="roi-calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roi-calculator">ROI Calculator</TabsTrigger>
          <TabsTrigger value="irr-calculator">IRR Calculator</TabsTrigger>
          <TabsTrigger value="document-tools">Document Tools</TabsTrigger>
          <TabsTrigger value="analysis-tools">Analysis Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="roi-calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>ROI Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                  <Input
                    id="initialInvestment"
                    type="number"
                    placeholder="1000000"
                    value={roiInputs.initialInvestment}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, initialInvestment: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="finalValue">Final Value ($)</Label>
                  <Input
                    id="finalValue"
                    type="number"
                    placeholder="1500000"
                    value={roiInputs.finalValue}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, finalValue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="timePeriod">Time Period (Years)</Label>
                  <Input
                    id="timePeriod"
                    type="number"
                    placeholder="5"
                    value={roiInputs.timePeriod}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, timePeriod: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="annualCashFlow">Annual Cash Flow ($)</Label>
                  <Input
                    id="annualCashFlow"
                    type="number"
                    placeholder="50000"
                    value={roiInputs.annualCashFlow}
                    onChange={(e) => setRoiInputs((prev) => ({ ...prev, annualCashFlow: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={calculateROI}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Calculate ROI
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                {roiResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{roiResults.annualROI.toFixed(2)}%</div>
                        <div className="text-sm text-muted-foreground">Annual ROI</div>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          ${roiResults.totalProfit.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Profit</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-secondary/10 rounded-lg">
                        <div className="text-2xl font-bold text-secondary">
                          ${roiResults.totalReturn.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Return</div>
                      </div>
                      <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">${roiResults.monthlyReturn.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Monthly Return</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter values and calculate to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="irr-calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>IRR Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="irrInitialInvestment">Initial Investment ($)</Label>
                  <Input
                    id="irrInitialInvestment"
                    type="number"
                    placeholder="1000000"
                    value={irrInputs.initialInvestment}
                    onChange={(e) => setIrrInputs((prev) => ({ ...prev, initialInvestment: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Annual Cash Flows ($)</Label>
                  {irrInputs.cashFlows.map((cf, index) => (
                    <Input
                      key={index}
                      type="number"
                      placeholder={`Year ${index + 1} Cash Flow`}
                      value={cf}
                      onChange={(e) => {
                        const newCashFlows = [...irrInputs.cashFlows]
                        newCashFlows[index] = e.target.value
                        setIrrInputs((prev) => ({ ...prev, cashFlows: newCashFlows }))
                      }}
                      className="mt-2"
                    />
                  ))}
                </div>
                <div>
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    placeholder="10"
                    value={irrInputs.discountRate}
                    onChange={(e) => setIrrInputs((prev) => ({ ...prev, discountRate: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={calculateIRR}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Calculate IRR
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IRR Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {irrResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{irrResults.irr.toFixed(2)}%</div>
                        <div className="text-sm text-muted-foreground">IRR</div>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">${irrResults.npv.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">NPV</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-secondary/10 rounded-lg">
                        <div className="text-2xl font-bold text-secondary">{irrResults.paybackPeriod}</div>
                        <div className="text-sm text-muted-foreground">Payback Period (Years)</div>
                      </div>
                      <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">{irrResults.profitabilityIndex.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Profitability Index</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter cash flows and calculate to see IRR analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="document-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Letter of Intent</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate a professional Letter of Intent for real estate transactions with customizable terms and
                  conditions.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary">Professional Template</Badge>
                  <Badge variant="secondary">Customizable</Badge>
                </div>
                <Button
                  onClick={() => generateDocument("LOI")}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Generate LOI
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Non-Disclosure Agreement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create comprehensive NDAs to protect confidential information during deal negotiations and due
                  diligence.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary">Legal Compliance</Badge>
                  <Badge variant="secondary">Mutual Protection</Badge>
                </div>
                <Button
                  onClick={() => generateDocument("NDA")}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Generate NDA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Offering Memorandum</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate detailed Offering Memorandums with investment summaries, risk disclosures, and financial
                  projections.
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary">SEC Compliant</Badge>
                  <Badge variant="secondary">Comprehensive</Badge>
                </div>
                <Button
                  onClick={() => generateDocument("OM")}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  Generate OM
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Analyze how changes in key variables affect investment returns and risk profiles.
                </p>
                <div className="h-48 bg-card border rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>Sensitivity Chart</p>
                  </div>
                </div>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Run Analysis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Compare investment opportunities against market benchmarks and similar deals.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">Market Average IRR</span>
                    <Badge>12.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">Sector Premium</span>
                    <Badge>+2.3%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">Risk Adjustment</span>
                    <Badge>-0.8%</Badge>
                  </div>
                </div>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Compare Deals
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
