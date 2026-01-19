import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function Dashboard() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check if they paid
  const { data: profile } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPaid = profile?.is_paid

  // Fetch their leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('contractor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">RoofResponse Dashboard</h1>
        <div className="text-gray-500">{user.email}</div>
      </div>

      {/* TRIAL BANNER - SHOWS IF NOT PAID */}
      {!isPaid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex justify-between items-center">
          <div>
            <h3 className="text-red-800 font-bold flex items-center gap-2">
              ⚠️ Trial Mode Active
            </h3>
            <p className="text-red-600 text-sm">
              You are limited to 5 leads. Upgrade to unlock unlimited AI responses.
            </p>
          </div>
          {/* REPLACE THE LINK BELOW WITH YOUR LEMON SQUEEZY LINK */}
          <a 
            href="YOUR_LEMON_SQUEEZY_LINK_HERE" 
            target="_blank"
            className="no-underline"
          >
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Upgrade to Pro ($299/mo)
            </Button>
          </a>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.map((lead: any) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name || 'Unknown'}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {leads?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No leads yet. Send a test SMS to your Twilio number!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}