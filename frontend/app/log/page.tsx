"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"

export default function LogPage() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)

    try {
      // Direct call to backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/log/food`, {
        raw_text: input,
        mood_rating: 5 // Default for now
      })

      setResult(response.data)
      toast.success("Meal logged successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to log meal. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Log a Meal</h1>
            <p className="text-muted-foreground">
              Just describe what you ate. We'll handle the numbers.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>What did you eat?</CardTitle>
              <CardDescription>
                Example: "I had a grilled chicken salad with avocado and a coffee."
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="food-input">Your Description</Label>
                <Textarea
                  id="food-input"
                  placeholder="Type or speak here..."
                  className="min-h-[150px] text-lg"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full h-12 text-lg"
              >
                {loading ? "Analyzing..." : "Log Meal"}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Analysis Complete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-green-900">
                <div>
                  <h3 className="font-semibold">Mood</h3>
                  <p>{result.analysis.mood_analysis}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm">
                  <div>
                    <div className="text-sm text-gray-500">Calories</div>
                    <div className="text-xl font-bold">{result.analysis.total_calories}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Protein</div>
                    <div className="text-xl font-bold">{result.analysis.total_protein}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Carbs</div>
                    <div className="text-xl font-bold">{result.analysis.total_carbs}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fat</div>
                    <div className="text-xl font-bold">{result.analysis.total_fat}g</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Detected Items</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.analysis.items.map((item: any, i: number) => (
                      <li key={i}>
                        {item.name} ({item.quantity}) - {item.calories} kcal
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  )
}
