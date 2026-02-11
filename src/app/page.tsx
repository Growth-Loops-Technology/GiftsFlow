import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Store, Gift } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 text-gray-800">
      {/* HERO */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <Gift className="w-14 h-14 text-amber-600" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Finding the Perfect Gift Should Feel Magical
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          GiftsFlow is an AI-powered gift assistant that helps customers
          discover thoughtful gifts — while empowering local gift shops with
          intelligent recommendations.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/gifts">
            <Button size="lg">Try the Gift Assistant</Button>
          </Link>
          <Link href="/portal">
            <Button size="lg" variant="outline">
              Partner With Us
            </Button>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">How GiftsFlow Works</h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <Bot className="mx-auto w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Ask the AI</h3>
              <p className="text-muted-foreground">
                Tell us who you&apos;re buying for, your budget, and the occasion.
              </p>
            </div>

            <div>
              <Sparkles className="mx-auto w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Get Smart Suggestions
              </h3>
              <p className="text-muted-foreground">
                Our AI suggests gifts from real shop inventories.
              </p>
            </div>

            <div>
              <Store className="mx-auto w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Support Local Shops
              </h3>
              <p className="text-muted-foreground">
                Discover unique gifts from nearby stores and vendors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOR CUSTOMERS */}
      <section className="py-20 bg-amber-50">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Never Run Out of Gift Ideas Again
            </h2>
            <p className="text-muted-foreground mb-6">
              Whether it&apos;s a birthday, anniversary, or last-minute surprise —
              GiftsFlow understands your needs and recommends thoughtful,
              meaningful options instantly.
            </p>

            <Link href="/gifts">
              <Button size="lg">Start Chatting</Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md">
            <p className="italic text-muted-foreground">
              “I need a birthday gift under ₹1500 for my best friend who loves
              art.”
            </p>
          </div>
        </div>
      </section>

      {/* FOR GIFT SHOPS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-amber-100 rounded-2xl p-8 shadow-md">
            <h3 className="font-semibold mb-2">Upload Your Inventory</h3>
            <p className="text-sm text-muted-foreground">
              Just upload your Excel sheet. Our AI handles the rest.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">
              Turn Your Shop into an AI-Powered Store
            </h2>
            <p className="text-muted-foreground mb-6">
              GiftsFlow helps local vendors connect with customers through an
              intelligent chatbot that understands preferences, budgets, and
              occasions.
            </p>

            <Link href="/portal">
              <Button size="lg">Join as Vendor</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* OPEN SOURCE / COMMUNITY */}
      <section className="py-20 bg-gradient-to-br from-orange-100 to-amber-50 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">
            Built as an Open Innovation Project
          </h2>
          <p className="text-muted-foreground mb-8">
            GiftsFlow is part of Growth Loops Labs — empowering students,
            developers, and local businesses through open-source innovation.
          </p>
          <Link href="https://github.com/Growth-Loops-Technology/GiftsFlow">
            <Button variant="outline" size="lg">
              Contribute on GitHub
            </Button>
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Experience Smarter Gifting?
        </h2>

        <Link href="/gifts">
          <Button size="lg">Try GiftsFlow Now</Button>
        </Link>
      </section>
    </div>
  );
}
