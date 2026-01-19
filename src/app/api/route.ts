import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    // 1. Read the incoming text message
    const formData = await request.formData();
    const incomingMessage = formData.get('Body') as string;
    const senderNumber = formData.get('From') as string;

    console.log(`Message from ${senderNumber}: ${incomingMessage}`);

    // 2. Ask OpenAI for a response
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant for a roofing company called RoofResponse. You help customers schedule repairs. Keep answers short and friendly." 
        },
        { role: "user", content: incomingMessage },
      ],
    });

    const aiResponse = completion.choices[0].message.content || "I'm not sure how to respond to that.";

    // 3. Send the response back to Twilio (TwiML)
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(aiResponse);

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}