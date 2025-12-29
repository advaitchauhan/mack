"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CustomInterviewPage() {
  const router = useRouter()
  const [customQuestions, setCustomQuestions] = useState<string[]>([""])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const categories = [
    { id: "leadership", label: "Leadership" },
    { id: "teamwork", label: "Teamwork" },
    { id: "problem-solving", label: "Problem Solving" },
    { id: "communication", label: "Communication" },
    { id: "conflict", label: "Conflict Resolution" },
    { id: "failure", label: "Handling Failure" },
    { id: "success", label: "Success Stories" },
    { id: "time-management", label: "Time Management" },
  ]

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Marketing",
    "Customer Service",
  ]

  const addQuestion = () => {
    setCustomQuestions([...customQuestions, ""])
  }

  const removeQuestion = (index: number) => {
    const newQuestions = [...customQuestions]
    newQuestions.splice(index, 1)
    setCustomQuestions(newQuestions)
  }

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...customQuestions]
    newQuestions[index] = value
    setCustomQuestions(newQuestions)
  }

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const startCustomInterview = () => {
    // In a real app, this would save the custom interview configuration
    router.push("/interview/new?type=custom")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Custom Interview</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select the types of questions you want to include in your interview:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label htmlFor={category.id}>{category.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select an industry to tailor questions to your field:
              </p>

              <Select>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase()}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Add specific questions you want to practice:</p>

              <div className="space-y-4">
                {customQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Enter your custom question here..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      disabled={customQuestions.length === 1 && index === 0}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" onClick={addQuestion} className="gap-1">
                  <Plus size={16} />
                  Add Question
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Duration</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (10-15 min)</SelectItem>
                      <SelectItem value="medium">Medium (15-25 min)</SelectItem>
                      <SelectItem value="long">Long (25-40 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Entry Level</SelectItem>
                      <SelectItem value="medium">Mid-Level</SelectItem>
                      <SelectItem value="hard">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Interview Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Selected Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((id) => (
                        <Badge key={id} variant="secondary">
                          {categories.find((c) => c.id === id)?.label}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories selected</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Custom Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    {customQuestions.filter((q) => q.trim()).length} custom questions added
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={startCustomInterview}
                    disabled={selectedCategories.length === 0 && customQuestions.every((q) => !q.trim())}
                  >
                    Start Custom Interview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
