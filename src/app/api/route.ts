import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { checkSubscription } from "@/lib/utils"

// Initialize the tools
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming text from Twilio
    const formData = await request.formData()
    const incomingMsg = formData.get('Body') as string
    const fromPhone = formData.get('From') as string

    console.log(`Received SMS from ${fromPhone}: ${incomingMsg}`)

    // 2. Find the contractor who owns this phone number
    // (For this simplified version, we assume YOU are the only contractor for now)
    // In a real multi-tenant app, we'd look up the 'To' number.
    // Let's grab the first contractor found (You).
    const { data: contractor } = await supabase
      .from('contractors')
      .select('id, is_paid')
      .limit(1)
      .single()

    if (!contractor) return NextResponse.json({ error: 'No contractor found' }, { status: 404 })

    // 3. CHECK PAYMENT STATUS
    const isPaid = await checkSubscription(contractor.id)
    
    // Check lead count if not paid
    if (!isPaid) {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', contractor.id)
      
      if (count && count > 5) {
        console.log("Trial limit reached. Not replying.")
        return new NextResponse("<Response></Response>", {
          headers: { "Content-Type": "text/xml" },
        })
      }
    }

    // 4. Find or Create the Lead
    let { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', fromPhone)
      .single()

    if (!lead) {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          contractor_id: contractor.id,
          phone: fromPhone,
          name: 'New Lead',
          chat_history: []
        })
        .select()
        .single()
      lead = newLead
    }

    // 5. Ask AI for the reply
    const chatHistory = lead.chat_history || []
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful roofing assistant. Your goal is to find out if the user needs a repair or replacement, and how urgent it is. Keep replies short (under 160 chars)." },
        ...chatHistory.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: incomingMsg }
      ]
    })

    const aiReply = completion.choices[0].message.content || "Thanks, we will call you shortly."

    // 6. Save the conversation
    const newHistory = [
      ...chatHistory,
      { role: "user", content: incomingMsg },
      { role: "assistant", content: aiReply }
    ]

    await supabase
      .from('leads')
      .update({ chat_history: newHistory })
      .eq('id', lead.id)

    // 7. Send reply back to Twilio (TwiML)
    const twiml = `
      <Response>
        <Message>${aiReply}</Message>
      </Response>
    `

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}