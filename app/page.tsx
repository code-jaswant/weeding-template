import { Navbar } from "@/components/navbar"
import { TemplateGrid } from "@/components/template-grid"
import { HeroSection } from "@/components/hero-section"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Browse Templates</h2>
          <p className="text-muted-foreground text-lg">
            Discover beautiful wedding templates for every style and budget
          </p>
        </div>
        <TemplateGrid />
      </section>
    </main>
  )
}
