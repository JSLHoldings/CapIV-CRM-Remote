"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, SlidersHorizontal } from "lucide-react"

export interface FilterOptions {
  status?: string[]
  assetType?: string[]
  location?: string[]
  riskProfile?: string[]
  investmentSize?: { min: string; max: string }
  role?: string[]
}

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  sortBy: string
  onSortChange: (sort: string) => void
  resultCount: number
  onClearFilters: () => void
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  resultCount,
  onClearFilters,
}: SearchFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const statusOptions = ["Active", "Pending", "Under Review", "Closed"]
  const assetTypeOptions = ["Mixed-Use", "Industrial", "Multifamily", "Office", "Retail", "Student Housing"]
  const locationOptions = ["California", "Texas", "New York", "Florida", "Arizona", "Colorado", "North Carolina"]
  const riskProfileOptions = ["Core", "Core-Plus", "Value-Add", "Opportunistic"]
  const roleOptions = ["GP", "LP", "JV", "Co-GP"]
  const sortOptions = [
    { value: "name", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
    { value: "date", label: "Date Added" },
    { value: "size", label: "Deal Size" },
    { value: "return", label: "Target Return" },
  ]

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status?.length) count += filters.status.length
    if (filters.assetType?.length) count += filters.assetType.length
    if (filters.location?.length) count += filters.location.length
    if (filters.riskProfile?.length) count += filters.riskProfile.length
    if (filters.role?.length) count += filters.role.length
    if (filters.investmentSize?.min || filters.investmentSize?.max) count += 1
    return count
  }

  const handleFilterChange = (category: keyof FilterOptions, value: string, checked: boolean) => {
    const currentValues = (filters[category] as string[]) || []
    const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value)

    onFiltersChange({
      ...filters,
      [category]: newValues,
    })
  }

  const handleInvestmentSizeChange = (type: "min" | "max", value: string) => {
    onFiltersChange({
      ...filters,
      investmentSize: {
        min: filters.investmentSize?.min ?? "",
        max: filters.investmentSize?.max ?? "",
        [type]: value,
      },
    })
  }

  const removeFilter = (category: keyof FilterOptions, value?: string) => {
    if (category === "investmentSize") {
      onFiltersChange({
        ...filters,
        investmentSize: { min: "", max: "" },
      })
    } else if (value) {
      const currentValues = (filters[category] as string[]) || []
      onFiltersChange({
        ...filters,
        [category]: currentValues.filter((v) => v !== value),
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search deals, contacts, locations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative bg-transparent">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge className="ml-2 bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status?.includes(status) || false}
                          onCheckedChange={(checked) => handleFilterChange("status", status, checked as boolean)}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Type Filter */}
                <div>
                  <Label className="text-sm font-medium">Asset Type</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {assetTypeOptions.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`asset-${type}`}
                          checked={filters.assetType?.includes(type) || false}
                          onCheckedChange={(checked) => handleFilterChange("assetType", type, checked as boolean)}
                        />
                        <Label htmlFor={`asset-${type}`} className="text-sm">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {locationOptions.map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location}`}
                          checked={filters.location?.includes(location) || false}
                          onCheckedChange={(checked) => handleFilterChange("location", location, checked as boolean)}
                        />
                        <Label htmlFor={`location-${location}`} className="text-sm">
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Profile Filter */}
                <div>
                  <Label className="text-sm font-medium">Risk Profile</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {riskProfileOptions.map((risk) => (
                      <div key={risk} className="flex items-center space-x-2">
                        <Checkbox
                          id={`risk-${risk}`}
                          checked={filters.riskProfile?.includes(risk) || false}
                          onCheckedChange={(checked) => handleFilterChange("riskProfile", risk, checked as boolean)}
                        />
                        <Label htmlFor={`risk-${risk}`} className="text-sm">
                          {risk}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Size Filter */}
                <div>
                  <Label className="text-sm font-medium">Investment Size ($M)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="min-size" className="text-xs text-gray-500">
                        Min
                      </Label>
                      <Input
                        id="min-size"
                        type="number"
                        placeholder="0"
                        value={filters.investmentSize?.min || ""}
                        onChange={(e) => handleInvestmentSizeChange("min", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-size" className="text-xs text-gray-500">
                        Max
                      </Label>
                      <Input
                        id="max-size"
                        type="number"
                        placeholder="1000"
                        value={filters.investmentSize?.max || ""}
                        onChange={(e) => handleInvestmentSizeChange("max", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {roleOptions.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={filters.role?.includes(role) || false}
                          onCheckedChange={(checked) => handleFilterChange("role", role, checked as boolean)}
                        />
                        <Label htmlFor={`role-${role}`} className="text-sm">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsFiltersOpen(false)}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.status?.map((status) => (
            <Badge key={`status-${status}`} variant="secondary" className="flex items-center space-x-1">
              <span>Status: {status}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("status", status)} />
            </Badge>
          ))}
          {filters.assetType?.map((type) => (
            <Badge key={`asset-${type}`} variant="secondary" className="flex items-center space-x-1">
              <span>Asset: {type}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("assetType", type)} />
            </Badge>
          ))}
          {filters.location?.map((location) => (
            <Badge key={`location-${location}`} variant="secondary" className="flex items-center space-x-1">
              <span>Location: {location}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("location", location)} />
            </Badge>
          ))}
          {filters.riskProfile?.map((risk) => (
            <Badge key={`risk-${risk}`} variant="secondary" className="flex items-center space-x-1">
              <span>Risk: {risk}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("riskProfile", risk)} />
            </Badge>
          ))}
          {filters.role?.map((role) => (
            <Badge key={`role-${role}`} variant="secondary" className="flex items-center space-x-1">
              <span>Role: {role}</span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("role", role)} />
            </Badge>
          ))}
          {(filters.investmentSize?.min || filters.investmentSize?.max) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Size: ${filters.investmentSize?.min || "0"}M - ${filters.investmentSize?.max || "∞"}M
              </span>
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("investmentSize")} />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{resultCount} results found</p>
        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-secondary">
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  )
}
