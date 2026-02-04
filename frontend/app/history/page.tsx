"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/Navbar"
import { Search, Calendar, TrendingUp } from "lucide-react"

// Mock data - in the future this would come from a database
const mockFoodLogs = [
  {
    id: 1,
    date: "2026-02-03",
    time: "12:30 PM",
    raw_text: "Grilled chicken salad with avocado and olive oil dressing",
    mood_analysis: "energetic",
    total_calories: 520,
    total_protein: 38,
    total_carbs: 12,
    total_fat: 35,
    items: [
      { name: "grilled chicken breast", quantity: "6oz", calories: 280 },
      { name: "mixed greens", quantity: "2 cups", calories: 20 },
      { name: "avocado", quantity: "1/2 medium", calories: 120 },
      { name: "olive oil dressing", quantity: "2 tbsp", calories: 100 }
    ]
  },
  {
    id: 2,
    date: "2026-02-03",
    time: "8:00 AM",
    raw_text: "Oatmeal with blueberries and a coffee",
    mood_analysis: "sleepy but content",
    total_calories: 285,
    total_protein: 8,
    total_carbs: 54,
    total_fat: 4,
    items: [
      { name: "oatmeal", quantity: "1 cup cooked", calories: 150 },
      { name: "blueberries", quantity: "1/2 cup", calories: 40 },
      { name: "coffee", quantity: "1 cup", calories: 5 },
      { name: "milk", quantity: "2 tbsp", calories: 20 }
    ]
  },
  {
    id: 3,
    date: "2026-02-02",
    time: "7:15 PM",
    raw_text: "Pizza slice and a beer while watching the game",
    mood_analysis: "relaxed, social",
    total_calories: 450,
    total_protein: 18,
    total_carbs: 35,
    total_fat: 25,
    items: [
      { name: "pizza slice (pepperoni)", quantity: "1 large slice", calories: 300 },
      { name: "beer", quantity: "12oz", calories: 150 }
    ]
  },
  {
    id: 4,
    date: "2026-02-02",
    time: "1:00 PM",
    raw_text: "Turkey sandwich and chips from the deli",
    mood_analysis: "rushed, hungry",
    total_calories: 680,
    total_protein: 32,
    total_carbs: 58,
    total_fat: 32,
    items: [
      { name: "turkey sandwich", quantity: "1 whole", calories: 520 },
      { name: "potato chips", quantity: "small bag", calories: 160 }
    ]
  }
]

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  
  // Filter logs based on search and mood
  const filteredLogs = mockFoodLogs.filter(log => {
    const matchesSearch = log.raw_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMood = !selectedMood || log.mood_analysis.includes(selectedMood)
    return matchesSearch && matchesMood
  })

  // Get unique moods for filtering
  const allMoods = [...new Set(mockFoodLogs.map(log => log.mood_analysis))]
  
  // Calculate daily totals
  const dailyTotals = mockFoodLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { calories: 0, count: 0 }
    }
    acc[log.date].calories += log.total_calories
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
                <div className="text-2xl font-bold">{mockFoodLogs.length}</div>
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
                  {Math.round(Object.values(dailyTotals).reduce((sum, day) => sum + day.calories, 0) / Object.keys(dailyTotals).length)}
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

          {/* Food Log Entries */}
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
                      {log.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.name} ({item.quantity})</span>
                          <span className="text-gray-500">{item.calories} cal</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredLogs.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No entries found matching your search.</p>
            </Card>
          )}

        </div>
      </main>
    </div>
  )
}