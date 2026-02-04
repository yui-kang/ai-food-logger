import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Activity, Utensils, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4 text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Eat Smart. <span className="text-primary">Live Better.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          The AI-powered food logger that tracks not just calories, but your habits, mood, and behavioral patterns.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/log">
            <Button size="lg" className="h-12 px-8 text-lg gap-2">
              Log Meal <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
            View Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Activity className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Natural Logging</CardTitle>
            </CardHeader>
            <CardContent>
              Just say "I had a sandwich" or upload a photo. AI handles the math.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Brain className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Behavioral Insights</CardTitle>
            </CardHeader>
            <CardContent>
              Detect stress eating, late-night snacking, and other hidden patterns.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Utensils className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Smart Coaching</CardTitle>
            </CardHeader>
            <CardContent>
              Get personalized, compassionate feedback to improve your relationship with food.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
