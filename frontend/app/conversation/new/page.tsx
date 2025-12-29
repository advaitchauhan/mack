"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ConversationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationType = searchParams.get("type") || "restaurant"

  const [isStarted, setIsStarted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [currentStage, setCurrentStage] = useState(0)
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Get avatar info based on scenario
  const getAvatarInfo = () => {
    switch (conversationType) {
      case "restaurant":
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Jessica, Sarah & Emma",
          description: "Group of friends celebrating",
          fallback: "JSE",
        }
      case "coffee":
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Jessica",
          description: "Regular at this coffee shop",
          fallback: "J",
        }
      case "transit":
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Sarah",
          description: "Commuting downtown",
          fallback: "S",
        }
      case "street":
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Emma",
          description: "Walking downtown",
          fallback: "E",
        }
      case "interview":
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Sarah Johnson",
          description: "Senior HR Manager",
          fallback: "SJ",
        }
      default: // bar
        return {
          image: "/placeholder.svg?height=100&width=100",
          name: "Jessica",
          description: "Out with friends tonight",
          fallback: "J",
        }
    }
  }

  const avatarInfo = getAvatarInfo()

  // Update the getScenarioDescription function to include new scenarios
  const getScenarioDescription = () => {
    switch (conversationType) {
      case "restaurant":
        return "You're at a restaurant and notice a group of women at a nearby table. You'll need to approach the group and start a conversation respectfully."
      case "coffee":
        return "You're at a coffee shop and notice someone interesting at a nearby table. You'll need to approach and start the conversation."
      case "transit":
        return "You're on a bus or train and notice someone interesting nearby. You'll need to initiate a respectful conversation."
      case "street":
        return "You're walking downtown and see someone interesting walking by. You'll need to approach quickly but respectfully to start a conversation."
      case "interview":
        return "You're in a behavioral job interview. The interviewer will ask you questions about your past experiences and how you've handled various work situations."
      default:
        return "You're at a bar and notice someone interesting. You'll need to approach and start the conversation."
    }
  }

  // Update the conversationFlow arrays to include new scenarios
  const getConversationFlow = () => {
    switch (conversationType) {
      case "restaurant":
        return [
          "Hi there! I'm Jessica, and these are my friends Sarah and Emma. We're celebrating Sarah's promotion. Nice to meet you!",
          "We're from around here. Sarah and I work together, and Emma is visiting from out of town. Are you local?",
          "That's cool! We were just talking about good places to go out around here. Do you have any recommendations?",
          "We've heard about that place! Is it usually crowded on weekends?",
          "That sounds fun! We might check it out later. What brings you out tonight?",
        ]
      case "coffee":
        return [
          "Hi there! Yes, this seat is free. Feel free to join me.",
          "I come here pretty often actually. Their caramel latte is amazing. What about you?",
          "I live just a few blocks away. This neighborhood has some great spots. What brings you to this area?",
          "I'm actually a graphic designer. I love coming here to work sometimes - the atmosphere helps me think. What do you do?",
          "That sounds interesting! What do you enjoy most about your work?",
        ]
      case "transit":
        return [
          "Hi! No, the seat isn't taken. Please, go ahead.",
          "Yeah, it's quite a day out there. Are you heading home or just starting your day?",
          "I'm reading this new novel that just came out. It's really captivating so far.",
          "I mostly enjoy fiction, especially mysteries and historical novels. What kind of books do you like?",
          "Those sound interesting! I'll have to check them out. My stop is coming up soon, but I've enjoyed talking with you.",
        ]
      case "street":
        return [
          "Oh, hi! Yeah, I was just heading to grab lunch. What did you want to talk about?",
          "That's sweet of you to say. I'm actually on a bit of a tight schedule though.",
          "I appreciate the compliment. Where are you heading?",
          "That's nice. I'm Emma by the way. What's your name?",
          "It was nice meeting you too, but I really do need to get going. Have a great day!",
        ]
      case "interview":
        return [
          "Great, thank you for coming in today. Let's start with this: Tell me about a time when you had to work with a difficult team member. How did you handle it?",
          "That's a good example. Now, can you describe a situation where you had to make a decision with incomplete information?",
          "Interesting approach. Tell me about a time when you had to adapt to a significant change at work. How did you manage it?",
          "I see. Can you share an example of when you failed at something? How did you handle it and what did you learn?",
          "Thank you for sharing that. One last question: Describe a project where you had to lead a team to achieve a challenging goal.",
        ]
      default: // bar
        return [
          "Hi there! I'm Jessica. Nice to meet you!",
          "I'm having a gin and tonic. It's my go-to drink here. They make them really well.",
          "I've lived in the city for about 2 years now. Still discovering new places like this. How about you?",
          "That's cool! I love trying new restaurants around here. Have you found any good spots?",
          "I enjoy hiking on weekends and I'm part of a book club. What about you? What do you enjoy doing when you're not out?",
        ]
    }
  }

  const conversationFlow = getConversationFlow()

  // Update the conversation simulation to reflect user initiation (except for interview)
  useEffect(() => {
    if (isStarted) {
      // For interview, the interviewer starts
      if (conversationType === "interview" && transcript.length === 0) {
        setTranscript([
          {
            speaker: "AI Conversation Partner",
            text: conversationFlow[0],
          },
        ])
        setCurrentStage(1)
        return
      }

      // For other scenarios, prompt the user to start the conversation
      if (transcript.length === 0) {
        setTranscript([
          {
            speaker: "System",
            text: "It's your turn to initiate the conversation. Speak naturally as if you're approaching someone you're interested in.",
          },
        ])

        const timer = setTimeout(() => {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "You",
              text: "This is where your conversation starter would appear. In the real application, you would speak your opening line and the AI would respond accordingly.",
            },
          ])

          setTimeout(() => {
            setTranscript((prev) => [
              ...prev,
              {
                speaker: "AI Conversation Partner",
                text: conversationFlow[0],
              },
            ])
            setCurrentStage(1)
          }, 3000)
        }, 5000)

        return () => clearTimeout(timer)
      }
      // Continue with the rest of the conversation
      else if (currentStage > 0 && currentStage < conversationFlow.length) {
        const timer = setTimeout(() => {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "You",
              text: "This is where your actual response would appear in the real application. The AI would transcribe what you say and add it to this conversation history.",
            },
          ])

          if (currentStage < conversationFlow.length - 1) {
            setTimeout(() => {
              setTranscript((prev) => [
                ...prev,
                {
                  speaker: "AI Conversation Partner",
                  text: conversationFlow[currentStage],
                },
              ])
              setCurrentStage((prev) => prev + 1)
            }, 3000)
          }
        }, 5000)

        return () => clearTimeout(timer)
      }
    }
  }, [isStarted, currentStage, conversationFlow, transcript.length, conversationFlow.length, conversationType])

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

  const startConversation = () => {
    setIsStarted(true)
  }

  const endConversation = () => {
    router.push(`/review/new-${Date.now()}`)
  }

  const getScenarioTitle = () => {
    switch (conversationType) {
      case "restaurant":
        return "Restaurant Group Conversation"
      case "coffee":
        return "Coffee Shop Conversation"
      case "transit":
        return "Public Transit Conversation"
      case "street":
        return "Street Approach"
      case "interview":
        return "Behavioral Job Interview"
      default:
        return "Bar Conversation"
    }
  }

  const getPartnerName = () => {
    switch (conversationType) {
      case "restaurant":
        return "The Group"
      case "interview":
        return "Interviewer"
      default:
        return "Her"
    }
  }

  return (
    <div className="container mx-auto py-4 px-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Card className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border-2 border-rose-200">
                <AvatarImage src={avatarInfo.image || "/placeholder.svg"} alt={avatarInfo.name} />
                <AvatarFallback className="bg-rose-100 text-rose-700">{avatarInfo.fallback}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">{avatarInfo.name}</div>
                <div className="text-xs text-muted-foreground">{avatarInfo.description}</div>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{getScenarioTitle()}</h1>
            {conversationType === "restaurant" && (
              <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">
                Advanced
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleCamera} className={!isCameraOn ? "bg-muted" : ""}>
            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleMic} className={!isMicOn ? "bg-muted" : ""}>
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </Button>
          <Button variant="destructive" onClick={endConversation} className="gap-2">
            <PhoneOff size={18} />
            End Conversation
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
                    <h2 className="text-xl font-semibold">Ready to start your conversation practice?</h2>
                    <p className="text-muted-foreground">
                      {getScenarioDescription()} Remember to be genuine, respectful, and listen actively.
                    </p>
                    {conversationType !== "interview" && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                        <p className="font-medium">Important:</p>
                        <p className="text-sm">
                          You'll need to initiate the conversation. Think about how you would approach
                          {conversationType === "restaurant" ? " a group" : " someone"} in this setting.
                        </p>
                      </div>
                    )}
                  </div>
                  <Button size="lg" onClick={startConversation}>
                    Begin {conversationType === "interview" ? "Interview" : "Conversation"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{conversationType === "interview" ? "Interview" : "Conversation"} Progress</span>
                      <span>{Math.round((currentStage / conversationFlow.length) * 100)}% Complete</span>
                    </div>
                    <Progress value={(currentStage / conversationFlow.length) * 100} className="h-2" />
                  </div>

                  <div className="flex-grow overflow-y-auto p-4 bg-muted/50 rounded-lg mb-4">
                    <div className="space-y-6">
                      {transcript.map((entry, index) => (
                        <div key={index} className="space-y-1">
                          <div
                            className={`font-medium ${
                              entry.speaker === "AI Conversation Partner" ? "text-rose-600" : ""
                            }`}
                          >
                            {entry.speaker === "AI Conversation Partner" ? getPartnerName() : entry.speaker}
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
                  {conversationType === "restaurant" ? (
                    <>
                      <li>Be confident but respectful when approaching a group</li>
                      <li>Address the whole group, not just one person</li>
                      <li>Keep your introduction brief and friendly</li>
                      <li>Read social cues - if they seem busy or uninterested, politely exit</li>
                      <li>Have a reason for approaching that isn't too forward</li>
                    </>
                  ) : conversationType === "street" ? (
                    <>
                      <li>Be brief and direct - she's on the move</li>
                      <li>Start with a genuine compliment or observation</li>
                      <li>Respect her time and space</li>
                      <li>If she's not interested, politely accept and move on</li>
                      <li>Have a quick, natural reason for stopping her</li>
                    </>
                  ) : conversationType === "interview" ? (
                    <>
                      <li>Use the STAR method (Situation, Task, Action, Result)</li>
                      <li>Be specific with examples from your experience</li>
                      <li>Keep responses concise but thorough (1-2 minutes)</li>
                      <li>Focus on your actions and contributions</li>
                      <li>Be honest about challenges and what you learned</li>
                    </>
                  ) : (
                    <>
                      <li>Start with a contextual opener relevant to the setting</li>
                      <li>Be genuine and authentic</li>
                      <li>Ask open-ended questions</li>
                      <li>Listen actively and respond thoughtfully</li>
                      <li>Respect boundaries and social cues</li>
                      <li>Focus on finding common interests</li>
                    </>
                  )}
                </ul>

                {conversationType !== "interview" && (
                  <div className="mt-4 pt-4 border-t border-muted">
                    <p className="font-medium mb-1">Example Conversation Starters:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {conversationType === "restaurant" && (
                        <>
                          <li>
                            "Hi there! I couldn't help but notice you all seem to be having a great time. I'm [name],
                            would you mind if I introduced myself?"
                          </li>
                          <li>
                            "Excuse me, I'm sorry to interrupt, but I noticed you were talking about [something you
                            overheard]. I'm actually really interested in that too."
                          </li>
                        </>
                      )}
                      {conversationType === "coffee" && (
                        <>
                          <li>
                            "Hi, I noticed you're reading [book/working on laptop]. Mind if I join you for a moment?"
                          </li>
                          <li>"Excuse me, could you recommend something good here? I'm new to this coffee shop."</li>
                        </>
                      )}
                      {conversationType === "transit" && (
                        <>
                          <li>"Excuse me, is this seat taken? It's quite crowded today."</li>
                          <li>"I couldn't help noticing the book you're reading. Is it good?"</li>
                        </>
                      )}
                      {conversationType === "street" && (
                        <>
                          <li>
                            "Excuse me, I know this is random, but I just had to tell you that you have great style."
                          </li>
                          <li>
                            "Hi, I'm sorry to stop you, but I thought you looked interesting and I'd regret not saying
                            hello."
                          </li>
                        </>
                      )}
                      {conversationType === "bar" && (
                        <>
                          <li>"Hi there! I'm [name]. Would you mind if I joined you for a moment?"</li>
                          <li>"That looks like an interesting drink. What is it if you don't mind me asking?"</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
