"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const interviewType = searchParams.get("type") || "general"

  const [isStarted, setIsStarted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock questions based on interview type
  const questions = [
    "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
    "Describe a situation where you had to make a decision with incomplete information.",
    "Can you share an example of when you had to adapt to a significant change at work?",
    "Tell me about a time when you failed at something. How did you handle it?",
    "Describe a project where you had to gather and analyze data to solve a problem.",
  ]

  // Simulate AI speaking
  useEffect(() => {
    if (isStarted && currentQuestion < questions.length) {
      // Add AI question to transcript
      setTranscript((prev) => [
        ...prev,
        {
          speaker: "AI Interviewer",
          text: questions[currentQuestion],
        },
      ])

      // Simulate user response after 5 seconds (in a real app, this would be actual user input)
      const timer = setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          // Add mock user response
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "You",
              text: "This is where your actual response would appear in the real application. The AI would transcribe what you say and add it to this conversation history.",
            },
          ])

          // Move to next question after 3 more seconds
          setTimeout(() => {
            setCurrentQuestion((prev) => prev + 1)
          }, 3000)
        }
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isStarted, currentQuestion, questions.length])

  // Setup camera when component mounts
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
          setIsCameraOn(false)
        })
    }

    return () => {
      // Clean up video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isCameraOn])

  const toggleCamera = () => {
    if (isCameraOn && videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getVideoTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraOn(!isCameraOn)
  }

  const toggleMic = () => {
    setIsMicOn(!isMicOn)
  }

  const startInterview = () => {
    setIsStarted(true)
  }

  const endInterview = () => {
    // In a real app, this would save the interview recording and transcript
    router.push(`/review/new-${Date.now()}`)
  }

  const getInterviewTitle = () => {
    switch (interviewType) {
      case "leadership":
        return "Leadership Skills Interview"
      case "problem-solving":
        return "Problem Solving Interview"
      default:
        return "General Behavioral Interview"
    }
  }

  return (
    <div className="container mx-auto py-4 px-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{getInterviewTitle()}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleCamera} className={!isCameraOn ? "bg-muted" : ""}>
            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleMic} className={!isMicOn ? "bg-muted" : ""}>
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </Button>
          <Button variant="destructive" onClick={endInterview} className="gap-2">
            <PhoneOff size={18} />
            End Interview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
        <div className="md:col-span-2 flex flex-col">
          <Card className="flex-grow flex flex-col">
            <CardContent className="p-6 flex-grow flex flex-col">
              {!isStarted ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">Ready to start your interview?</h2>
                    <p className="text-muted-foreground">
                      You'll be asked {questions.length} behavioral questions. Speak clearly and take your time with
                      responses.
                    </p>
                  </div>
                  <Button size="lg" onClick={startInterview}>
                    Begin Interview
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        Question {currentQuestion + 1} of {questions.length}
                      </span>
                      <span>{Math.round((currentQuestion / questions.length) * 100)}% Complete</span>
                    </div>
                    <Progress value={(currentQuestion / questions.length) * 100} className="h-2" />
                  </div>

                  <div className="flex-grow overflow-y-auto p-4 bg-muted/50 rounded-lg mb-4">
                    <div className="space-y-6">
                      {transcript.map((entry, index) => (
                        <div key={index} className="space-y-1">
                          <div className={`font-medium ${entry.speaker === "AI Interviewer" ? "text-primary" : ""}`}>
                            {entry.speaker}
                          </div>
                          <p className="text-sm">{entry.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {isMicOn ? "Listening..." : "Microphone is muted"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col">
          <Card className="flex-grow">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="relative bg-black rounded-lg overflow-hidden flex-grow flex items-center justify-center mb-4">
                {isCameraOn ? (
                  <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8 text-white/70">
                    <VideoOff size={48} className="mx-auto mb-2" />
                    <p>Camera is turned off</p>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the STAR method (Situation, Task, Action, Result)</li>
                  <li>Speak clearly and at a moderate pace</li>
                  <li>Be specific with examples</li>
                  <li>Keep responses under 2 minutes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
