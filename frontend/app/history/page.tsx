"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/Navbar"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { Search, Calendar, TrendingUp, Loader2, Pencil, Trash2, RefreshCw, Calculator, List, Plus, X } from "lucide-react"

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [foodLogs, setFoodLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit/Delete state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [updating, setUpdating] = useState<number | null>(null)
  const [reanalyzing, setReanalyzing] = useState<number | null>(null)
  
  // Macro editing state
  const [editingMacrosId, setEditingMacrosId] = useState<number | null>(null)
  const [editMacros, setEditMacros] = useState({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0
  })

  // Item editing state  
  const [editingItemsId, setEditingItemsId] = useState<number | null>(null)
  const [editItems, setEditItems] = useState<any[]>([])
  const [recalculateTotals, setRecalculateTotals] = useState(true)

  // Fetch food history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        
        // Get auth token for API calls
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await axios.get(`${apiUrl}/history`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        })
        
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

  // Edit entry
  const handleEdit = (log: any) => {
    setEditingId(log.id)
    setEditText(log.raw_text)
  }

  const handleSaveEdit = async (entryId: number) => {
    try {
      setUpdating(entryId)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await axios.put(`${apiUrl}/entries/${entryId}`, {
        raw_text: editText,
        mood_rating: null, // Keep existing mood rating
        image_url: null    // Keep existing image URL
      }, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      
      // Update local state optimistically
      setFoodLogs(prev => prev.map(log => 
        log.id === entryId 
          ? { ...log, raw_text: editText }
          : log
      ))
      
      setEditingId(null)
      setEditText("")
      
    } catch (err: any) {
      console.error("Update failed:", err)
      alert("Failed to update entry: " + (err.response?.data?.detail || "Unknown error"))
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  // Edit macros
  const handleEditMacros = (log: any) => {
    setEditingMacrosId(log.id)
    setEditMacros({
      total_calories: log.total_calories || 0,
      total_protein: log.total_protein || 0,
      total_carbs: log.total_carbs || 0,
      total_fat: log.total_fat || 0
    })
  }

  const handleSaveMacros = async (entryId: number) => {
    try {
      setUpdating(entryId)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await axios.patch(`${apiUrl}/entries/${entryId}/macros`, editMacros, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      
      // Update local state optimistically
      setFoodLogs(prev => prev.map(log => 
        log.id === entryId 
          ? { 
              ...log, 
              total_calories: editMacros.total_calories,
              total_protein: editMacros.total_protein,
              total_carbs: editMacros.total_carbs,
              total_fat: editMacros.total_fat
            }
          : log
      ))
      
      setEditingMacrosId(null)
      
    } catch (err: any) {
      console.error("Macro update failed:", err)
      alert("Failed to update macros: " + (err.response?.data?.detail || "Unknown error"))
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelMacrosEdit = () => {
    setEditingMacrosId(null)
    setEditMacros({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 })
  }

  // Edit items
  const handleEditItems = (log: any) => {
    setEditingItemsId(log.id)
    setEditItems(log.items || [])
  }

  const handleSaveItems = async (entryId: number) => {
    try {
      setUpdating(entryId)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await axios.patch(`${apiUrl}/entries/${entryId}/items`, {
        items: editItems,
        recalculate_totals: recalculateTotals
      }, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      
      // Update local state optimistically
      setFoodLogs(prev => prev.map(log => {
        if (log.id === entryId) {
          const updated = { ...log, items: editItems }
          // If we recalculated totals, update them too
          if (response.data.macros) {
            updated.total_calories = response.data.macros.total_calories
            updated.total_protein = response.data.macros.total_protein
            updated.total_carbs = response.data.macros.total_carbs  
            updated.total_fat = response.data.macros.total_fat
          }
          return updated
        }
        return log
      }))
      
      setEditingItemsId(null)
      setEditItems([])
      
    } catch (err: any) {
      console.error("Items update failed:", err)
      alert("Failed to update items: " + (err.response?.data?.detail || "Unknown error"))
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelItemsEdit = () => {
    setEditingItemsId(null)
    setEditItems([])
  }

  const addNewItem = () => {
    setEditItems(prev => [...prev, {
      name: "",
      quantity: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }])
  }

  const removeItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setEditItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  // Delete entry
  const handleDelete = async (entryId: number, rawText: string) => {
    if (!confirm(`Are you sure you want to delete this entry?\n\n"${rawText.substring(0, 50)}..."`)) {
      return
    }
    
    try {
      setUpdating(entryId)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      await axios.delete(`${apiUrl}/entries/${entryId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      
      // Remove from local state
      setFoodLogs(prev => prev.filter(log => log.id !== entryId))
      
    } catch (err: any) {
      console.error("Delete failed:", err)
      alert("Failed to delete entry: " + (err.response?.data?.detail || "Unknown error"))
    } finally {
      setUpdating(null)
    }
  }

  // Re-analyze entry
  const handleReanalyze = async (entryId: number) => {
    try {
      setReanalyzing(entryId)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await axios.post(`${apiUrl}/entries/${entryId}/reanalyze`, {}, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })
      
      const analysis = response.data.analysis
      
      // Update local state with new analysis
      setFoodLogs(prev => prev.map(log => 
        log.id === entryId 
          ? { 
              ...log, 
              mood_analysis: analysis.mood_analysis,
              total_calories: analysis.total_calories,
              total_protein: analysis.total_protein,
              total_carbs: analysis.total_carbs,
              total_fat: analysis.total_fat,
              items: analysis.items
            }
          : log
      ))
      
    } catch (err: any) {
      console.error("Reanalyze failed:", err)
      alert("Failed to re-analyze entry: " + (err.response?.data?.detail || "Unknown error"))
    } finally {
      setReanalyzing(null)
    }
  }
  
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
    <ProtectedRoute>
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
                    ? Math.round(Object.values(dailyTotals).reduce((sum: number, day: any) => sum + day.calories, 0) / Object.keys(dailyTotals).length)
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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{log.mood_analysis}</Badge>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReanalyze(log.id)}
                          disabled={reanalyzing === log.id || updating === log.id}
                          title="Re-analyze with AI"
                        >
                          {reanalyzing === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditItems(log)}
                          disabled={updating === log.id || reanalyzing === log.id || editingMacrosId === log.id || editingItemsId === log.id}
                          title="Edit food items"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMacros(log)}
                          disabled={updating === log.id || reanalyzing === log.id || editingMacrosId === log.id || editingItemsId === log.id}
                          title="Edit macros"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(log)}
                          disabled={updating === log.id || reanalyzing === log.id || editingMacrosId === log.id || editingItemsId === log.id}
                          title="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(log.id, log.raw_text)}
                          disabled={updating === log.id || reanalyzing === log.id}
                          title="Delete entry"
                          className="text-red-600 hover:text-red-700"
                        >
                          {updating === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Editable text field or display text */}
                  {editingId === log.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="resize-none"
                        rows={3}
                        placeholder="Edit your food description..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(log.id)}
                          disabled={updating === log.id}
                        >
                          {updating === log.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updating === log.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 italic">"{log.raw_text}"</p>
                  )}
                  
                  {/* Macros - Editable or Display */}
                  <div className="bg-slate-100 p-4 rounded-lg">
                    {editingMacrosId === log.id ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm mb-2">Edit Nutrition Values:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Calories</label>
                            <Input
                              type="number"
                              value={editMacros.total_calories}
                              onChange={(e) => setEditMacros(prev => ({ ...prev, total_calories: parseInt(e.target.value) || 0 }))}
                              className="text-center"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editMacros.total_protein}
                              onChange={(e) => setEditMacros(prev => ({ ...prev, total_protein: parseFloat(e.target.value) || 0 }))}
                              className="text-center"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editMacros.total_carbs}
                              onChange={(e) => setEditMacros(prev => ({ ...prev, total_carbs: parseFloat(e.target.value) || 0 }))}
                              className="text-center"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Fat (g)</label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editMacros.total_fat}
                              onChange={(e) => setEditMacros(prev => ({ ...prev, total_fat: parseFloat(e.target.value) || 0 }))}
                              className="text-center"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveMacros(log.id)}
                            disabled={updating === log.id}
                          >
                            {updating === log.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Saving...
                              </>
                            ) : (
                              "Save Macros"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelMacrosEdit}
                            disabled={updating === log.id}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    )}
                  </div>
                  
                  {/* Food Items - Editable or Display */}
                  <div>
                    {editingItemsId === log.id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm">Edit Food Items:</h4>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={recalculateTotals}
                                onChange={(e) => setRecalculateTotals(e.target.checked)}
                              />
                              Auto-recalculate totals
                            </label>
                            <Button size="sm" variant="outline" onClick={addNewItem}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {editItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded border">
                              <div className="col-span-3">
                                <label className="text-xs text-gray-500 block">Name</label>
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                                  placeholder="Food name"
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500 block">Quantity</label>
                                <Input
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                  placeholder="150g"
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block">Cal</label>
                                <Input
                                  type="number"
                                  value={item.calories}
                                  onChange={(e) => updateItem(index, 'calories', parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block">P</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.protein}
                                  onChange={(e) => updateItem(index, 'protein', parseFloat(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block">C</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.carbs}
                                  onChange={(e) => updateItem(index, 'carbs', parseFloat(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-1">
                                <label className="text-xs text-gray-500 block">F</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.fat}
                                  onChange={(e) => updateItem(index, 'fat', parseFloat(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              
                              <div className="col-span-2 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveItems(log.id)}
                            disabled={updating === log.id}
                          >
                            {updating === log.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Saving...
                              </>
                            ) : (
                              "Save Items"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelItemsEdit}
                            disabled={updating === log.id}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
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
                    )}
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
    </ProtectedRoute>
  )
}