"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/Navbar"
import { Search, Calendar, TrendingUp, Loader2 } from "lucide-react"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [foodLogs, setFoodLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch food history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await axios.get(`${apiUrl}/history`)
        
        if (response.data.status === "success") {
          setFoodLogs(response.data.data || [])
        } else {
          setError("Failed to load history")
        }
      } catch (err: any) {
        console.error("History fetch error:", err)
        setError(err.response?.data?.error || "Failed to load history")
        // Fallback to empty array instead of mock data
        setFoodLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])
  
  // Filter logs based on search and mood
  const filteredLogs = foodLogs.filter(log => {
    const matchesSearch = log.raw_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.items?.some((item: any) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMood = !selectedMood || log.mood_analysis?.includes(selectedMood)
    return matchesSearch && matchesMood
  })

  // Get unique moods for filtering
  const allMoods = [...new Set(foodLogs.map(log => log.mood_analysis).filter(Boolean))]
  
  // Calculate daily totals
  const dailyTotals = foodLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { calories: 0, count: 0 }
    }
    acc[log.date].calories += log.total_calories || 0
    acc[log.date].count += 1
    return acc
  }, {} as Record<string, { calories: number, count: number }>)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto py-10 px-4">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Food History</h1>
            <p className="text-muted-foreground">
              Track your eating patterns and nutritional insights over time.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : foodLogs.length}</div>
                <p className="text-xs text-muted-foreground">Logged meals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily Calories</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(dailyTotals).length > 0 
                    ? Math.round(Object.values(dailyTotals).reduce((sum, day: any) => sum + day.calories, 0) / Object.keys(dailyTotals).length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Per day average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Common Mood</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Energetic</div>
                <p className="text-xs text-muted-foreground">When eating</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMood === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMood(null)}
              >
                All Moods
              </Button>
              {allMoods.map(mood => (
                <Button
                  key={mood}
                  variant={selectedMood === mood ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMood(mood)}
                >
                  {mood}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your food history...</p>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-12 text-center border-red-200 bg-red-50">
              <p className="text-red-600 mb-2">Failed to load history</p>
              <p className="text-sm text-red-500">{error}</p>
            </Card>
          )}

          {/* Food Log Entries */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{log.date}</CardTitle>
                      <p className="text-sm text-muted-foreground">{log.time}</p>
                    </div>
                    <Badge variant="secondary">{log.mood_analysis}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 italic">"{log.raw_text}"</p>
                  
                  {/* Macros */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-100 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{log.total_calories}</div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{log.total_protein}g</div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{log.total_carbs}g</div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{log.total_fat}g</div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                  
                  {/* Food Items */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Items:</h4>
                    <ul className="text-sm space-y-1">
                      {log.items?.map((item: any, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.name} ({item.quantity})</span>
                          <span className="text-gray-500">{item.calories} cal</span>
                        </li>
                      )) || []}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              ))}
              
              {filteredLogs.length === 0 && foodLogs.length > 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No entries found matching your search.</p>
                </Card>
              )}
              
              {foodLogs.length === 0 && !loading && !error && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-2">No food logs yet!</p>
                  <p className="text-sm text-gray-500">Start by logging your first meal.</p>
                </Card>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}