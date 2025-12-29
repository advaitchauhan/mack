"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, Clock, BarChart3, ChevronRight } from "lucide-react"

// Mock data for interview history
const mockInterviews = [
  {
    id: "1",
    type: "General Behavioral",
    date: new Date(2024, 4, 20),
    duration: "18 minutes",
    score: 85,
    questions: 10,
  },
  {
    id: "2",
    type: "Leadership Skills",
    date: new Date(2024, 4, 18),
    duration: "22 minutes",
    score: 78,
    questions: 8,
  },
  {
    id: "3",
    type: "Problem Solving",
    date: new Date(2024, 4, 15),
    duration: "16 minutes",
    score: 92,
    questions: 7,
  },
]

export default function InterviewHistoryList() {
  const [interviews] = useState(mockInterviews)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Interview History</h2>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">You haven't completed any interviews yet</p>
            <Link href="/interview/new">
              <Button>Start Your First Practice</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Link href={`/review/${interview.id}`} key={interview.id}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{interview.type}</h3>
                        <Badge variant="outline" className="ml-2">
                          {interview.score}% Score
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={14} />
                          <span>{formatDistanceToNow(interview.date, { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{interview.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 size={14} />
                          <span>{interview.questions} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
