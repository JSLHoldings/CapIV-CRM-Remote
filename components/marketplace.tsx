"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Mail, Phone, Globe, MapPin } from "lucide-react"
import { SearchFilters } from "@/components/search-filters"
import { tabs } from "@/constants/tabs"

interface Contact {
  id: string
  entityName: string
  contactPerson: string
  title: string
  email: string
  phone: string
  linkedinWebsite: string
  country: string
  region: string
  assetClassSpecialization: string
  activeInvestmentProfile: string
  capitalStageStructure: string
  role: string
  trackRecord: string
  capitalSize: string
  investmentSize: string
  verifiedDate: string
  notes: string
}

export function Marketplace() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("Current")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: [],
    assetType: [],
    location: [],
    riskProfile: [],
    investmentSize: { min: "", max: "" },
    role: [],
  })
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    const sampleContacts: Contact[] = [
      {
        id: "1",
        entityName: "Urban Axis Capital",
        contactPerson: "Miles Chen",
        title: "Partner",
        email: "miles.chen@urbanaxis.com",
        phone: "+1 (310) 555-0842",
        linkedinWebsite: "https://www.linkedin.com/in/mileschen/",
        country: "USA",
        region: "California",
        assetClassSpecialization: "Infill, Retail, Community Redevelopment",
        activeInvestmentProfile: "OZ Funds, 2026–2028 targeting CA + TX",
        capitalStageStructure: "GP,SPV,OZ Equity",
        role: "JV,GP",
        trackRecord: "$300M+ OZ development; 5 SPVs since 2021",
        capitalSize: "$300M–$600M",
        investmentSize: "$20M–$250M",
        verifiedDate: "2025-07-16",
        notes: "Institutional-grade platform with development and acquisition arms.",
      },
      {
        id: "2",
        entityName: "Pacific Real Estate Partners",
        contactPerson: "Sarah Johnson",
        title: "Managing Director",
        email: "sarah.johnson@pacificre.com",
        phone: "+1 (415) 555-0923",
        linkedinWebsite: "https://www.linkedin.com/in/sarahjohnson/",
        country: "USA",
        region: "California",
        assetClassSpecialization: "Multifamily, Mixed-Use",
        activeInvestmentProfile: "Core-Plus, 2025–2027 West Coast",
        capitalStageStructure: "LP,Co-GP",
        role: "LP",
        trackRecord: "$500M+ multifamily portfolio",
        capitalSize: "$200M–$400M",
        investmentSize: "$10M–$100M",
        verifiedDate: "2025-06-20",
        notes: "Focus on sustainable development and ESG compliance.",
      },
      {
        id: "3",
        entityName: "Metropolitan Investment Group",
        contactPerson: "David Rodriguez",
        title: "Senior Vice President",
        email: "david.rodriguez@metinvest.com",
        phone: "+1 (212) 555-0756",
        linkedinWebsite: "https://www.linkedin.com/in/davidrodriguez/",
        country: "USA",
        region: "New York",
        assetClassSpecialization: "Office, Retail, Industrial",
        activeInvestmentProfile: "Value-Add, 2025–2028 Northeast",
        capitalStageStructure: "GP,JV",
        role: "GP",
        trackRecord: "$800M+ commercial real estate",
        capitalSize: "$500M–$1B",
        investmentSize: "$25M–$200M",
        verifiedDate: "2025-05-15",
        notes: "Specializes in urban redevelopment projects.",
      },
    ]
    setContacts(sampleContacts)
    setFilteredContacts(sampleContacts)
  }, [])

  useEffect(() => {
    const filtered = contacts.filter((contact) => {
      // Text search
      const matchesSearch =
        contact.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.assetClassSpecialization.toLowerCase().includes(searchTerm.toLowerCase())

      // Role filter (tab-based filtering)
      const matchesTab = activeTab === "Current" || contact.role.toLowerCase().includes(activeTab.toLowerCase())

      // Location filter
      const matchesLocation =
        !filters.location?.length ||
        filters.location.some((loc) => contact.region.toLowerCase().includes(loc.toLowerCase()))

      // Role filter from advanced filters
      const matchesRole = !filters.role?.length || filters.role.some((role) => contact.role.includes(role))

      // Investment size filter
      const investmentRange = contact.investmentSize.replace(/[$M,]/g, "").split("–")
      const minInvestment = Number.parseFloat(investmentRange[0]) || 0
      const maxInvestment = Number.parseFloat(investmentRange[1]) || Number.POSITIVE_INFINITY
      const filterMin = filters.investmentSize?.min ? Number.parseFloat(filters.investmentSize.min) : 0
      const filterMax = filters.investmentSize?.max
        ? Number.parseFloat(filters.investmentSize.max)
        : Number.POSITIVE_INFINITY
      const matchesSize = minInvestment >= filterMin && maxInvestment <= filterMax

      return matchesSearch && matchesTab && matchesLocation && matchesRole && matchesSize
    })

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.entityName.localeCompare(b.entityName)
        case "name-desc":
          return b.entityName.localeCompare(a.entityName)
        case "date":
          return new Date(b.verifiedDate).getTime() - new Date(a.verifiedDate).getTime()
        case "size":
          const aSize = Number.parseFloat(a.capitalSize.replace(/[$M,]/g, "").split("–")[0]) || 0
          const bSize = Number.parseFloat(b.capitalSize.replace(/[$M,]/g, "").split("–")[0]) || 0
          return bSize - aSize
        default:
          return 0
      }
    })

    setFilteredContacts(filtered)
  }, [contacts, searchTerm, activeTab, filters, sortBy])

  const handleAddContact = (newContact: Omit<Contact, "id">) => {
    const contact: Contact = {
      ...newContact,
      id: Date.now().toString(),
    }
    setContacts((prev) => [...prev, contact])
    setIsAddDialogOpen(false)
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Access Circle</h1>
      </div>

      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredContacts.length}
        onClearFilters={handleClearFilters}
      />

      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Meet Investors</h2>
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" className="bg-background text-secondary hover:bg-background/90">
              Discover
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-secondary-foreground text-secondary-foreground hover:bg-background hover:text-secondary bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <ContactForm onSubmit={handleAddContact} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* People Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <h3 className="text-xl font-semibold">People</h3>
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  size="sm"
                  className={activeTab === tab ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{filteredContacts.length} contacts</div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground mb-1">{contact.entityName}</CardTitle>
            <p className="text-sm text-muted-foreground">{contact.contactPerson}</p>
            <p className="text-xs text-muted-foreground">{contact.title}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {contact.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {contact.region}, {contact.country}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="truncate">{contact.email}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{contact.phone}</span>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Specialization:</p>
          <p className="text-sm text-foreground line-clamp-2">{contact.assetClassSpecialization}</p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Investment Size:</p>
          <p className="text-sm font-medium text-foreground">{contact.investmentSize}</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            View Details
          </Button>
          {contact.linkedinWebsite && (
            <Button size="sm" variant="ghost" className="p-1">
              <Globe className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ContactForm({ onSubmit }: { onSubmit: (contact: Omit<Contact, "id">) => void }) {
  const [formData, setFormData] = useState({
    entityName: "",
    contactPerson: "",
    title: "",
    email: "",
    phone: "",
    linkedinWebsite: "",
    country: "",
    region: "",
    assetClassSpecialization: "",
    activeInvestmentProfile: "",
    capitalStageStructure: "",
    role: "",
    trackRecord: "",
    capitalSize: "",
    investmentSize: "",
    verifiedDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      entityName: "",
      contactPerson: "",
      title: "",
      email: "",
      phone: "",
      linkedinWebsite: "",
      country: "",
      region: "",
      assetClassSpecialization: "",
      activeInvestmentProfile: "",
      capitalStageStructure: "",
      role: "",
      trackRecord: "",
      capitalSize: "",
      investmentSize: "",
      verifiedDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entityName">Entity Name *</Label>
          <Input
            id="entityName"
            value={formData.entityName}
            onChange={(e) => setFormData((prev) => ({ ...prev, entityName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="linkedinWebsite">LinkedIn/Website</Label>
          <Input
            id="linkedinWebsite"
            value={formData.linkedinWebsite}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkedinWebsite: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="assetClassSpecialization">Asset Class Specialization</Label>
        <Input
          id="assetClassSpecialization"
          value={formData.assetClassSpecialization}
          onChange={(e) => setFormData((prev) => ({ ...prev, assetClassSpecialization: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            placeholder="GP, LP, JV, etc."
          />
        </div>
        <div>
          <Label htmlFor="investmentSize">Investment Size</Label>
          <Input
            id="investmentSize"
            value={formData.investmentSize}
            onChange={(e) => setFormData((prev) => ({ ...prev, investmentSize: e.target.value }))}
            placeholder="$10M-$100M"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          Add Contact
        </Button>
      </div>
    </form>
  )
}
