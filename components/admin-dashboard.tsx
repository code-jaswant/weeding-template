"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateManager } from "./admin/template-manager"
import { OrderManager } from "./admin/order-manager"

export function AdminDashboard({ templates, orders }: { templates: any[]; orders: any[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplateManager templates={templates} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManager orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
