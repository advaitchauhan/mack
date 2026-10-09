'use client'

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Target, PlayCircle, History, Sparkles } from "lucide-react"
import ConversationHistoryList from "@/components/conversation-history-list"
import { Badge } from "@/components/ui/badge"
import { getAllScenarios } from "@/lib/scenarios"
import { ModeToggle, useGameMode, GameMode } from "@/components/mode-toggle"
import { LevelSelect } from "@/components/level-select"

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    beginner: { label: 'Beginner', className: 'bg-green-100 text-green-800 border-green-200' },
    intermediate: { label: 'Intermediate', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    advanced: { label: 'Advanced', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  }[difficulty] || { label: difficulty, className: '' }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

export default function Dashboard() {
  const allScenarios = getAllScenarios()
  const { mode, setMode, isLoaded } = useGameMode()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-6 w-6 text-rose-500" />
              <h1 className="text-3xl font-bold tracking-tight">Mack</h1>
            </div>
            <p className="text-muted-foreground">
              Practice real conversations. Build real confidence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle onModeChange={setMode} />
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="practice" className="gap-2">
              <Target size={16} />
              Practice Scenarios
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History size={16} />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="space-y-8">
            {/* Show Linear Mode (Level Select) or Free Play Mode based on toggle */}
            {mode === 'linear' ? (
              <LevelSelect />
            ) : (
              <>
                {/* Featured scenario for Free Play */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 p-8 text-white">
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <Badge className="bg-white/20 text-white border-0">
                        Recommended
                      </Badge>
                      <h2 className="text-2xl font-bold">Coffee Shop</h2>
                      <p className="text-white/90 max-w-md">
                        The perfect starting point. Practice a relaxed, natural conversation
                        in a comfortable setting.
                      </p>
                    </div>
                    <Link href="/scenario/coffee/intro">
                      <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                        <PlayCircle size={20} />
                        Start Practice
                      </Button>
                    </Link>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-rose-500" />
                  </div>
                </div>

                {/* Scenario grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">All Scenarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allScenarios.map((scenario) => (
                      <Card key={scenario.type} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Scenario image */}
                        <div className="relative h-40 bg-muted">
                          <Image
                            src={scenario.avatar}
                            alt={scenario.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3">
                            <DifficultyBadge difficulty={scenario.difficulty} />
                          </div>
                        </div>

                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{scenario.name}</CardTitle>
                          </div>
                          <CardDescription>{scenario.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="pb-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} />
                              <span>{scenario.duration}</span>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-2">
                          <Link href={`/scenario/${scenario.type}/intro`} className="w-full">
                            <Button className="w-full gap-2" variant="outline">
                              <PlayCircle size={16} />
                              Start Practice
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tips section - shown in both modes */}
            <div className="bg-muted/50 rounded-lg p-6 mt-8">
              <h3 className="font-semibold mb-3">Tips for Success</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-600 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Be Genuine</p>
                    <p>Authenticity beats scripted lines every time.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-600 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Listen Actively</p>
                    <p>The best conversations are two-way streets.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-600 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Practice Makes Progress</p>
                    <p>Every conversation builds confidence.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ConversationHistoryList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
