"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function OrderManager({ orders }: { orders: any[] }) {
  const totalRevenue = orders.reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orders.filter((o) => o.status === "completed").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Order ID</th>
                  <th className="text-left py-2">Template</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                    <td className="py-3">{order.order_items?.[0]?.templates?.name || "N/A"}</td>
                    <td className="py-3">${order.total_amount.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
