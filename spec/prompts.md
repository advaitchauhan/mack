# Original Product Prompt

## Initial Request

You'll notice that there are now a number of companies that offer an experience where an end user can have a live voice/video conversation with an "AI" that responds back to them - Mercor has an AI interviewer and interview prep product. Yoodli has a sales coach that helps sales reps practice selling. Outset has an AI UX researcher that asks end users product and feedback related questions.

I'd like to build a web app / game that helps men practice conversations that they can use to approach women.

The initial MVP of this app is the following:
The app is structured like a course. There are different lessons/levels. Each level contains video tutorials on "how to talk" and then there is the "practice exercise what you've been taught" experience in which the user has a simulated conversation where they practice the skills.

Each "scenario" is a conversation simulation, similar to Mercor's AI interviewer or other AI interviewer experiences.

There is a description on the screen that is happening. This could either be:
- You are at a bar and there is a cute girl sitting alone next to you
- You are at a bar and there is a group of cute girls
- Eg you are a the coffee shop, you've ordered and are waiting for a coffee
- There is a cute girl in line

Then there is the voice experience:
- User has to start the conversation
- Girl responds
- And then it goes from there

The recorded conversations are stored in a separate view/tab. For each one, I can click into it and see the entire conversation recording as well as some interview insights / feedback on what went well vs what hasn't gone well - this can open up on the right half of the screen when I click on a conversation. I can also see a transcript of the entire conversation. Note that we should NOT have a transcript during the conversation.

I have uploaded a prototype frontend of the product so you can get a gist of the general idea. I'd like for you to now build this into a real product with a workout backend that we can deploy. The frontend was a very rough prototype so even if we want to just use it as a starting point / v1 I'd also ask you to put on your consumer product manager / designer hat on to make user experience improvements to it.

The most important thing is that the conversation simulation experience really feels like a game as well as a realistic experience where the user feels like they really practiced a conversation. I think when a user enters the scenario, there should be a timed experience where we set the scene for them similar to a text based computer game - eg for the coffee shop scenario we tell them OK you have entered the coffee shop and you see the girl sitting at a table in the corner of the shop. You'll need to go up. You are approaching and walking up to her in 5,4,3,2,1… (the countdown begins). At 0 the user is transitioned to the AI conversation experience where he can see an image of the women and the UI tells the user to start the conversation. From there the girl starts responding and they converse.

On the backend you should have specific prompts for each scenario that give the girl the right character. Eg for the coffee shop case we should include in the prompt for the AI girl that she is a girl sitting down at a coffee shop who has just ordered her coffee. She has a vibrant voice. She was previously at pilates this morning and is here because she is meeting her friend soon. Etc etc etc. This is all prompt context so that when the user asks questions he gets appropriate answers. In the future we will add more and more to the prompt (eg this girl seems a bit uninterested and standoffish, this girl is super chatty, this girl says she is already dating someone) so that our user will get to practice a bunch of different scenarios.

You can think through the rest of this but I'm just giving you my initial train of thought. First make a spec/PRD in planning mode, then a tech spec, and then we can build. Save the specs to the spec folder. Also save this prompt that I have provided here to a file prompts.md in the spec folder too. My guess is you want to use 11x or something like that for low latency voice conversations. And to make the experience more realistic ideally there is some AI live avatar service so I can see the person I'm talking to. Or something like HeyGen which is a real human/feels like a video call. Although I like the 3d talking avatar idea. The avatar can be a next milestone though if you want. The priority is to get a nice working product experience - we can initially start locally. I do want you to test it out, feel free to use the cursor browser.

## Key Requirements Summary

1. **Game-like experience** - Immersive scene setting with countdown
2. **Voice conversation** - Real-time AI voice interaction
3. **Character personalities** - Unique prompts per scenario
4. **No live transcript** - Only shown in review
5. **Conversation recording** - Full audio stored for playback
6. **Feedback & insights** - AI-generated analysis of performance
7. **History view** - Access to past conversations

## Technology Preferences

- ElevenLabs for low-latency voice AI
- Static images with animation for MVP (avatars later)
- Local PostgreSQL first, Supabase later
- Practice scenarios only (lessons deferred)
