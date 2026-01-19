import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">RoofResponse Dashboard</h1>
        <Button>Refresh Leads</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1 */}
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <h3 className="text-gray-500 text-sm font-medium">Total Leads</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        {/* Card 2 */}
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <h3 className="text-gray-500 text-sm font-medium">Messages Sent</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        {/* Card 3 */}
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <h3 className="text-gray-500 text-sm font-medium">Status</h3>
          <p className="text-green-600 text-xl font-bold mt-2">Active</p>
        </div>
      </div>

      <div className="mt-8 p-6 border rounded-xl bg-gray-50">
        <p className="text-center text-gray-500">Waiting for first lead...</p>
      </div>
    </div>
  )
}