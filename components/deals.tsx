"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowRight, Plus, MapPin, DollarSign, Calendar, Building, Upload, FileText, TrendingUp, Users, Star, Heart, Share2, Bookmark, Eye, Download, MessageCircle, BarChart3, PieChart, Activity } from "lucide-react"
import { SearchFilters } from "@/components/search-filters"

interface Deal {
  id: string
  title: string
  location: string
  assetType: string
  dealSize: string
  status: "Active" | "Pending" | "Closed" | "Under Review"
  sponsor: string
  targetReturn: string
  holdPeriod: string
  description: string
  dateAdded: string
  investmentType: "Equity" | "Debt" | "Hybrid"
  riskProfile: "Core" | "Core-Plus" | "Value-Add" | "Opportunistic"
  // Enhanced interactive data
  views: number
  likes: number
  isLiked?: boolean
  isBookmarked?: boolean
  progress: number
  investors: number
  minimumInvestment: string
  currentRaise: string
  maxRaise: string
  images?: string[]
  keyMetrics: {
    capRate: string
    noi: string
    occupancy: string
    yearBuilt: string
  }
  timeline: Array<{
    date: string
    milestone: string
    status: "completed" | "pending" | "upcoming"
  }>
}

export function Deals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isOMDialogOpen, setIsOMDialogOpen] = useState(false)
  const [selectedDealForOM, setSelectedDealForOM] = useState<Deal | null>(null)
  const [filters, setFilters] = useState({
    status: [],
    assetType: [],
    location: [],
    riskProfile: [],
    investmentSize: { min: "", max: "" },
    role: [],
  })
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    const sampleDeals: Deal[] = [
      {
        id: "1",
        title: "Downtown Mixed-Use Development",
        location: "Los Angeles, CA",
        assetType: "Mixed-Use",
        dealSize: "$45M",
        status: "Active",
        sponsor: "Urban Axis Capital",
        targetReturn: "18-22%",
        holdPeriod: "5-7 years",
        description: "Prime downtown location with retail and residential components. Opportunity Zone qualified. This mixed-use development represents a unique opportunity to invest in a rapidly gentrifying neighborhood with strong demographic trends and limited new supply.",
        dateAdded: "2025-01-15",
        investmentType: "Equity",
        riskProfile: "Value-Add",
        views: 1247,
        likes: 89,
        isLiked: false,
        isBookmarked: false,
        progress: 68,
        investors: 23,
        minimumInvestment: "$100,000",
        currentRaise: "$30.6M",
        maxRaise: "$45M",
        images: ["/modern-apartment-building.png"],
        keyMetrics: {
          capRate: "5.2%",
          noi: "$2.34M",
          occupancy: "87%",
          yearBuilt: "2024"
        },
        timeline: [
          { date: "2024-01-15", milestone: "Land Acquisition", status: "completed" },
          { date: "2024-06-01", milestone: "Construction Start", status: "completed" },
          { date: "2025-03-01", milestone: "Construction Completion", status: "upcoming" },
          { date: "2025-06-01", milestone: "Leasing Launch", status: "upcoming" }
        ]
      },
      {
        id: "2",
        title: "Industrial Logistics Portfolio",
        location: "Phoenix, AZ",
        assetType: "Industrial",
        dealSize: "$120M",
        status: "Under Review",
        sponsor: "Pacific Real Estate Partners",
        targetReturn: "12-15%",
        holdPeriod: "3-5 years",
        description: "Class A industrial properties with long-term triple net leases to investment grade tenants. This portfolio consists of 5 strategically located distribution centers serving major e-commerce and logistics companies.",
        dateAdded: "2025-01-10",
        investmentType: "Equity",
        riskProfile: "Core-Plus",
        views: 892,
        likes: 45,
        isLiked: true,
        isBookmarked: true,
        progress: 42,
        investors: 18,
        minimumInvestment: "$250,000",
        currentRaise: "$50.4M",
        maxRaise: "$120M",
        images: ["/bustling-shopping-center.png"],
        keyMetrics: {
          capRate: "6.8%",
          noi: "$8.16M",
          occupancy: "98%",
          yearBuilt: "2022"
        },
        timeline: [
          { date: "2024-08-01", milestone: "Due Diligence Start", status: "completed" },
          { date: "2025-01-01", milestone: "Legal Review", status: "pending" },
          { date: "2025-02-15", milestone: "Final Approval", status: "upcoming" },
          { date: "2025-03-01", milestone: "Closing", status: "upcoming" }
        ]
      },
      {
        id: "3",
        title: "Luxury Multifamily Complex",
        location: "Austin, TX",
        assetType: "Multifamily",
        dealSize: "$85M",
        status: "Pending",
        sponsor: "Metropolitan Investment Group",
        targetReturn: "15-18%",
        holdPeriod: "4-6 years",
        description: "350-unit luxury apartment complex in high-growth submarket with value-add opportunities. Located in Austin's tech corridor with proximity to major employers and entertainment districts.",
        dateAdded: "2025-01-08",
        investmentType: "Equity",
        riskProfile: "Value-Add",
        views: 1567,
        likes: 112,
        isLiked: false,
        isBookmarked: false,
        progress: 85,
        investors: 31,
        minimumInvestment: "$75,000",
        currentRaise: "$72.25M",
        maxRaise: "$85M",
        images: ["/modern-apartment-living.png"],
        keyMetrics: {
          capRate: "4.8%",
          noi: "$4.08M",
          occupancy: "92%",
          yearBuilt: "2023"
        },
        timeline: [
          { date: "2024-11-01", milestone: "Marketing Launch", status: "completed" },
          { date: "2025-01-01", milestone: "Investor Presentations", status: "completed" },
          { date: "2025-02-01", milestone: "Final Close", status: "pending" },
          { date: "2025-03-01", milestone: "Fund Operations", status: "upcoming" }
        ]
      },
      {
        id: "4",
        title: "Office Building Acquisition",
        location: "Denver, CO",
        assetType: "Office",
        dealSize: "$65M",
        status: "Active",
        sponsor: "Rocky Mountain Capital",
        targetReturn: "10-13%",
        holdPeriod: "7-10 years",
        description: "Class A office building with stable tenant base and below-market rents. Located in Denver's central business district with excellent transportation access and modern amenities.",
        dateAdded: "2025-01-05",
        investmentType: "Equity",
        riskProfile: "Core",
        views: 743,
        likes: 67,
        isLiked: true,
        isBookmarked: false,
        progress: 31,
        investors: 12,
        minimumInvestment: "$150,000",
        currentRaise: "$20.15M",
        maxRaise: "$65M",
        images: ["/modern-apartment-building.png"],
        keyMetrics: {
          capRate: "5.5%",
          noi: "$3.575M",
          occupancy: "95%",
          yearBuilt: "2018"
        },
        timeline: [
          { date: "2024-12-01", milestone: "Market Analysis", status: "completed" },
          { date: "2025-01-01", milestone: "Investment Launch", status: "completed" },
          { date: "2025-04-01", milestone: "Due Diligence", status: "upcoming" },
          { date: "2025-06-01", milestone: "Closing", status: "upcoming" }
        ]
      },
      {
        id: "5",
        title: "Retail Strip Center",
        location: "Miami, FL",
        assetType: "Retail",
        dealSize: "$28M",
        status: "Closed",
        sponsor: "Sunshine Properties",
        targetReturn: "14-17%",
        holdPeriod: "3-5 years",
        description: "Anchored retail center with renovation and re-leasing opportunities. Located in high-traffic area with strong local demographics and redevelopment potential.",
        dateAdded: "2024-12-20",
        investmentType: "Equity",
        riskProfile: "Opportunistic",
        views: 445,
        likes: 23,
        isLiked: false,
        isBookmarked: true,
        progress: 100,
        investors: 15,
        minimumInvestment: "$50,000",
        currentRaise: "$28M",
        maxRaise: "$28M",
        images: ["/bustling-shopping-center.png"],
        keyMetrics: {
          capRate: "7.2%",
          noi: "$2.016M",
          occupancy: "78%",
          yearBuilt: "2015"
        },
        timeline: [
          { date: "2024-12-01", milestone: "Fundraising Launch", status: "completed" },
          { date: "2024-12-20", milestone: "Full Subscription", status: "completed" },
          { date: "2025-01-15", milestone: "Closing", status: "completed" },
          { date: "2025-02-01", milestone: "Asset Management", status: "completed" }
        ]
      },
      {
        id: "6",
        title: "Student Housing Development",
        location: "Chapel Hill, NC",
        assetType: "Student Housing",
        dealSize: "$52M",
        status: "Active",
        sponsor: "Education Realty Partners",
        targetReturn: "16-20%",
        holdPeriod: "5-7 years",
        description: "Purpose-built student housing near major university campus with guaranteed occupancy. Modern amenities and proximity to campus create strong rental demand.",
        dateAdded: "2024-12-15",
        investmentType: "Equity",
        riskProfile: "Value-Add",
        views: 987,
        likes: 78,
        isLiked: false,
        isBookmarked: false,
        progress: 56,
        investors: 19,
        minimumInvestment: "$80,000",
        currentRaise: "$29.12M",
        maxRaise: "$52M",
        images: ["/modern-apartment-living.png"],
        keyMetrics: {
          capRate: "6.1%",
          noi: "$3.172M",
          occupancy: "100%",
          yearBuilt: "2024"
        },
        timeline: [
          { date: "2024-10-01", milestone: "Construction Start", status: "completed" },
          { date: "2024-12-01", milestone: "Investment Launch", status: "completed" },
          { date: "2025-08-01", milestone: "Construction Complete", status: "upcoming" },
          { date: "2025-09-01", milestone: "Student Move-in", status: "upcoming" }
        ]
      },
    ]
    setDeals(sampleDeals)
    setFilteredDeals(sampleDeals)
  }, [])

  useEffect(() => {
    const filtered = deals.filter((deal) => {
      // Text search
      const matchesSearch =
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sponsor.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = !filters.status?.length || filters.status.includes(deal.status)

      // Asset type filter
      const matchesAssetType = !filters.assetType?.length || filters.assetType.includes(deal.assetType)

      // Location filter (check if deal location contains any of the filtered locations)
      const matchesLocation =
        !filters.location?.length ||
        filters.location.some((loc) => deal.location.toLowerCase().includes(loc.toLowerCase()))

      // Risk profile filter
      const matchesRiskProfile = !filters.riskProfile?.length || filters.riskProfile.includes(deal.riskProfile)

      // Investment size filter
      const dealSizeNum = Number.parseFloat(deal.dealSize.replace(/[$M,]/g, ""))
      const minSize = filters.investmentSize?.min ? Number.parseFloat(filters.investmentSize.min) : 0
      const maxSize = filters.investmentSize?.max
        ? Number.parseFloat(filters.investmentSize.max)
        : Number.POSITIVE_INFINITY
      const matchesSize = dealSizeNum >= minSize && dealSizeNum <= maxSize

      return matchesSearch && matchesStatus && matchesAssetType && matchesLocation && matchesRiskProfile && matchesSize
    })

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title)
        case "name-desc":
          return b.title.localeCompare(a.title)
        case "date":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        case "size":
          return (
            Number.parseFloat(b.dealSize.replace(/[$M,]/g, "")) - Number.parseFloat(a.dealSize.replace(/[$M,]/g, ""))
          )
        case "return":
          return Number.parseFloat(b.targetReturn.split("-")[0]) - Number.parseFloat(a.targetReturn.split("-")[0])
        default:
          return 0
      }
    })

    setFilteredDeals(filtered)
  }, [deals, searchTerm, filters, sortBy])

  const getStatusColor = (status: Deal["status"]) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success"
      case "Pending":
        return "bg-warning/10 text-warning-foreground"
      case "Under Review":
        return "bg-info/10 text-info"
      case "Closed":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getRiskProfileColor = (risk: Deal["riskProfile"]) => {
    switch (risk) {
      case "Core":
        return "bg-primary/10 text-primary"
      case "Core-Plus":
        return "bg-success/10 text-success"
      case "Value-Add":
        return "bg-secondary/10 text-secondary"
      case "Opportunistic":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleAddDeal = (newDeal: Omit<Deal, "id">) => {
    const deal: Deal = {
      ...newDeal,
      id: Date.now().toString(),
    }
    setDeals((prev) => [...prev, deal])
    setIsAddDialogOpen(false)
  }

  const handleSubmitOfferingMemorandum = (dealId: string, omData: any) => {
    // Store the offering memorandum submission
    const submissions = JSON.parse(localStorage.getItem('om-submissions') || '[]')
    const submission = {
      id: Date.now().toString(),
      dealId,
      dealTitle: deals.find(d => d.id === dealId)?.title,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      ...omData
    }
    submissions.push(submission)
    localStorage.setItem('om-submissions', JSON.stringify(submissions))
    setIsOMDialogOpen(false)
    setSelectedDealForOM(null)
  }

  const handleLikeDeal = (dealId: string) => {
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId 
          ? { 
              ...deal, 
              isLiked: !deal.isLiked, 
              likes: deal.isLiked ? deal.likes - 1 : deal.likes + 1 
            }
          : deal
      )
    )
  }

  const handleBookmarkDeal = (dealId: string) => {
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, isBookmarked: !deal.isBookmarked }
          : deal
      )
    )
  }

  const handleViewDeal = (dealId: string) => {
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, views: deal.views + 1 }
          : deal
      )
    )
  }

  const handleClearFilters = () => {
    setFilters({
      status: [],
      assetType: [],
      location: [],
      riskProfile: [],
      investmentSize: { min: "", max: "" },
      role: [],
    })
    setSearchTerm("")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">All deals</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            <DealForm onSubmit={handleAddDeal} />
          </DialogContent>
        </Dialog>
      </div>

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredDeals.length}
        onClearFilters={handleClearFilters}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Deal Summary */}
        <div className="space-y-6">
          <Card className="bg-muted">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">{deals.length}</div>
                  <div className="text-sm text-muted-foreground">Total Deals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">
                    {deals.filter((d) => d.status === "Active").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">
                    {deals.filter((d) => d.status === "Under Review").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Under Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground flex items-center justify-center space-x-2">
            <span>All Deals</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Columns - Deal Cards */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filteredDeals.length} deals found</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                Filter
              </Button>
              <Button size="sm" variant="outline">
                Sort
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onViewDetails={() => setSelectedDeal(deal)}
                getStatusColor={getStatusColor}
                getRiskProfileColor={getRiskProfileColor}
                onLike={handleLikeDeal}
                onBookmark={handleBookmarkDeal}
                onView={handleViewDeal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deal Details Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
          </DialogHeader>
          {selectedDeal && <DealDetails deal={selectedDeal} getRiskProfileColor={getRiskProfileColor} />}
        </DialogContent>
      </Dialog>

      {/* Offering Memorandum Submission Dialog */}
      <Dialog open={isOMDialogOpen} onOpenChange={setIsOMDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Offering Memorandum</DialogTitle>
          </DialogHeader>
          {selectedDealForOM && (
            <OfferingMemorandumForm 
              deal={selectedDealForOM} 
              onSubmit={(omData) => handleSubmitOfferingMemorandum(selectedDealForOM.id, omData)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DealCard({
  deal,
  onViewDetails,
  getStatusColor,
  getRiskProfileColor,
  onLike,
  onBookmark,
  onView,
}: {
  deal: Deal
  onViewDetails: () => void
  getStatusColor: (status: Deal["status"]) => string
  getRiskProfileColor: (risk: Deal["riskProfile"]) => string
  onLike: (dealId: string) => void
  onBookmark: (dealId: string) => void
  onView: (dealId: string) => void
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      {/* Image Header */}
      {deal.images && deal.images.length > 0 && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={deal.images[0]} 
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                onBookmark(deal.id)
              }}
            >
              <Bookmark className={`h-4 w-4 ${deal.isBookmarked ? 'fill-current text-blue-600' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                onLike(deal.id)
              }}
            >
              <Heart className={`h-4 w-4 ${deal.isLiked ? 'fill-current text-red-500' : ''}`} />
            </Button>
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle 
              className="text-lg font-semibold text-foreground mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onView(deal.id)
                onViewDetails()
              }}
            >
              {deal.title}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span>{deal.location}</span>
            </div>
          </div>
          {!deal.images && <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{deal.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${deal.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{deal.currentRaise}</span>
            <span>{deal.maxRaise}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{deal.assetType}</span>
          </div>
          <Badge className={getRiskProfileColor(deal.riskProfile)}>{deal.riskProfile}</Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{deal.dealSize}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-success">{deal.targetReturn}</span>
          </div>
        </div>

        {/* Interactive Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{deal.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{deal.investors}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation()
                onLike(deal.id)
              }}
            >
              <Heart className={`h-4 w-4 ${deal.isLiked ? 'fill-current text-red-500' : ''}`} />
              <span className="ml-1">{deal.likes}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation()
                onBookmark(deal.id)
              }}
            >
              <Bookmark className={`h-4 w-4 ${deal.isBookmarked ? 'fill-current text-blue-600' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Sponsor:</p>
          <p className="text-sm font-medium text-foreground">{deal.sponsor}</p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Min. Investment:</p>
          <p className="text-sm font-medium text-foreground">{deal.minimumInvestment}</p>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-card-foreground line-clamp-2">{deal.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onView(deal.id)
              onViewDetails()
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              // Add share functionality
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DealDetails({
  deal,
  getRiskProfileColor,
}: {
  deal: Deal
  getRiskProfileColor: (risk: Deal["riskProfile"]) => string
}) {
  return (
    <div className="space-y-6">
      {/* Header with Image */}
      {deal.images && deal.images.length > 0 && (
        <div className="relative h-64 overflow-hidden rounded-lg">
          <img 
            src={deal.images[0]} 
            alt={deal.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-bold mb-2">{deal.title}</h1>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{deal.location}</span>
              </div>
              <Badge className="bg-white/90 text-black">{deal.status}</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fundraising Progress</span>
                <span className="text-lg font-bold">{deal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${deal.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{deal.currentRaise}</span>
                <span>{deal.maxRaise}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Active Investors</span>
              </div>
              <p className="text-2xl font-bold">{deal.investors}</p>
              <p className="text-xs text-muted-foreground">Investors committed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Views</span>
              </div>
              <p className="text-2xl font-bold">{deal.views.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Deal Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-sm text-foreground flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{deal.location}</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Asset Type</Label>
              <p className="text-sm text-foreground">{deal.assetType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Deal Size</Label>
              <p className="text-sm font-semibold text-foreground">{deal.dealSize}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Risk Profile</Label>
              <Badge className={getRiskProfileColor(deal.riskProfile)}>{deal.riskProfile}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Investment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Sponsor</Label>
              <p className="text-sm text-foreground">{deal.sponsor}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Target Return</Label>
              <p className="text-sm font-semibold text-success flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{deal.targetReturn}</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Hold Period</Label>
              <p className="text-sm text-foreground flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{deal.holdPeriod}</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Min. Investment</Label>
              <p className="text-sm font-semibold text-foreground">{deal.minimumInvestment}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Key Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Cap Rate</p>
              <p className="text-lg font-bold">{deal.keyMetrics.capRate}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">NOI</p>
              <p className="text-lg font-bold">{deal.keyMetrics.noi}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Occupancy</p>
              <p className="text-lg font-bold">{deal.keyMetrics.occupancy}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Year Built</p>
              <p className="text-lg font-bold">{deal.keyMetrics.yearBuilt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Project Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deal.timeline.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'completed' ? 'bg-green-500' :
                  item.status === 'pending' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.milestone}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant={
                  item.status === 'completed' ? 'default' :
                  item.status === 'pending' ? 'secondary' :
                  'outline'
                }>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-card-foreground leading-relaxed">{deal.description}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Materials
        </Button>
        <Button variant="outline" onClick={() => {
          setSelectedDealForOM(deal)
          setIsOMDialogOpen(true)
        }}>
          <Upload className="w-4 h-4 mr-2" />
          Submit Offering Memorandum
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <MessageCircle className="w-4 h-4 mr-2" />
          Express Interest
        </Button>
      </div>
    </div>
  )
}

function DealForm({ onSubmit }: { onSubmit: (deal: Omit<Deal, "id">) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    assetType: "",
    dealSize: "",
    status: "Active" as Deal["status"],
    sponsor: "",
    targetReturn: "",
    holdPeriod: "",
    description: "",
    dateAdded: new Date().toISOString().split("T")[0],
    investmentType: "Equity" as Deal["investmentType"],
    riskProfile: "Core" as Deal["riskProfile"],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Deal Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assetType">Asset Type</Label>
          <Input
            id="assetType"
            value={formData.assetType}
            onChange={(e) => setFormData((prev) => ({ ...prev, assetType: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="dealSize">Deal Size</Label>
          <Input
            id="dealSize"
            value={formData.dealSize}
            onChange={(e) => setFormData((prev) => ({ ...prev, dealSize: e.target.value }))}
            placeholder="$50M"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sponsor">Sponsor</Label>
          <Input
            id="sponsor"
            value={formData.sponsor}
            onChange={(e) => setFormData((prev) => ({ ...prev, sponsor: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="targetReturn">Target Return</Label>
          <Input
            id="targetReturn"
            value={formData.targetReturn}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetReturn: e.target.value }))}
            placeholder="15-18%"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          Add Deal
        </Button>
      </div>
    </form>
  )
}

function OfferingMemorandumForm({ 
  deal, 
  onSubmit 
}: { 
  deal: Deal
  onSubmit: (omData: any) => void 
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    investmentAmount: "",
    accreditedInvestor: false,
    investmentExperience: "",
    additionalNotes: "",
    fileUpload: null as File | null
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, fileUpload: file }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Deal Information</h3>
        <p className="text-sm text-gray-600">{deal.title}</p>
        <p className="text-sm text-gray-500">{deal.location} • {deal.dealSize}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company/Entity Name *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactName">Contact Name *</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="investmentAmount">Proposed Investment Amount *</Label>
        <Input
          id="investmentAmount"
          value={formData.investmentAmount}
          onChange={(e) => setFormData((prev) => ({ ...prev, investmentAmount: e.target.value }))}
          placeholder="$100,000"
          required
        />
      </div>

      <div>
        <Label htmlFor="investmentExperience">Investment Experience *</Label>
        <select 
          id="investmentExperience"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={formData.investmentExperience}
          onChange={(e) => setFormData((prev) => ({ ...prev, investmentExperience: e.target.value }))}
          required
        >
          <option value="">Select experience level</option>
          <option value="beginner">Beginner (0-2 years)</option>
          <option value="intermediate">Intermediate (3-7 years)</option>
          <option value="advanced">Advanced (8+ years)</option>
          <option value="professional">Professional investor</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="accreditedInvestor"
          checked={formData.accreditedInvestor}
          onChange={(e) => setFormData((prev) => ({ ...prev, accreditedInvestor: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <Label htmlFor="accreditedInvestor" className="text-sm">
          I am an accredited investor
        </Label>
      </div>

      <div>
        <Label htmlFor="fileUpload">Upload Supporting Documents</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label htmlFor="fileUpload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                <span>Upload files</span>
                <input
                  id="fileUpload"
                  name="fileUpload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
          </div>
        </div>
        {formData.fileUpload && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {formData.fileUpload.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <textarea
          id="additionalNotes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={formData.additionalNotes}
          onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
          placeholder="Any additional information or questions..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Submit Offering Memorandum
        </Button>
      </div>
    </form>
  )
}
