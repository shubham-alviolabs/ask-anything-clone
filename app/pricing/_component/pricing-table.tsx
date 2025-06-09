"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type SubscriptionDetails = {
  id: string;
  productId: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  organizationId: string | null;
};

type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
  errorType?: "CANCELED" | "EXPIRED" | "GENERAL";
};

interface PricingTableProps {
  subscriptionDetails: SubscriptionDetailsResult;
}

export default function PricingTable({
  subscriptionDetails,
}: PricingTableProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        setIsAuthenticated(!!session.data?.user);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (productId: string, slug: string) => {
    if (isAuthenticated === false) {
      router.push("/sign-in");
      return;
    }

    try {
      await authClient.checkout({
        products: [productId],
        slug: slug,
      });
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleManageSubscription = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      toast.error("Failed to open subscription management");
    }
  };

  const STARTER_TIER = process.env.NEXT_PUBLIC_STARTER_TIER;
  const STARTER_SLUG = process.env.NEXT_PUBLIC_STARTER_SLUG;

  if (!STARTER_TIER || !STARTER_SLUG) {
    throw new Error("Missing required environment variables for Starter tier");
  }

  const isCurrentPlan = (tierProductId: string) => {
    return (
      subscriptionDetails.hasSubscription &&
      subscriptionDetails.subscription?.productId === tierProductId &&
      subscriptionDetails.subscription?.status === "active"
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Back to Home Link */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center">
          <h1 className="text-[2.5rem] font-light text-zinc-900 dark:text-zinc-100 mb-6 tracking-[-0.02em] leading-tight">
            Pricing
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            Choose the plan that works best for you
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Free Plan */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-10 relative hover:border-zinc-300/80 dark:hover:border-zinc-700/80 transition-colors duration-200">
            <div className="mb-10">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3 tracking-[-0.01em]">Free</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">Get started with essential features</p>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">$0</span>
                <span className="text-zinc-400 dark:text-zinc-500 ml-2 text-sm">/month</span>
              </div>
            </div>

            <div className="mb-10">
              <ul className="space-y-4">
                <li className="flex items-center text-[15px]">
                  <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-zinc-700 dark:text-zinc-300">150 normal searches per day</span>
                </li>
                <li className="flex items-center text-[15px]">
                  <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-zinc-700 dark:text-zinc-300">20 extreme searches per month</span>
                </li>
                <li className="flex items-center text-[15px]">
                  <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-zinc-700 dark:text-zinc-300">Basic AI models</span>
                </li>
                <li className="flex items-center text-[15px]">
                  <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="text-zinc-700 dark:text-zinc-300">Search history</span>
                </li>
              </ul>
            </div>

            {!subscriptionDetails.hasSubscription || subscriptionDetails.subscription?.status !== "active" ? (
              <Button
                variant="outline"
                className="w-full h-9 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-normal text-sm tracking-[-0.01em]"
                disabled
              >
                Current plan
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-9 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-normal text-sm tracking-[-0.01em]"
                disabled
              >
                Free plan
              </Button>
            )}
          </div>

          {/* Pro Plan */}
          <div className="relative">
            {isCurrentPlan(STARTER_TIER) && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 text-xs font-normal tracking-wide">
                  CURRENT PLAN
                </Badge>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border-[1.5px] border-black dark:border-white rounded-xl p-10 relative shadow-sm">
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 tracking-[-0.01em]">Scira Pro</h3>
                  <Badge variant="secondary" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-normal px-2.5 py-1">
                    Popular
                  </Badge>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 leading-relaxed">Everything you need for unlimited usage</p>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">$15</span>
                  <span className="text-zinc-500 dark:text-zinc-400 ml-2 text-sm">/month</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 tracking-wide">CANCEL ANYTIME</p>
              </div>

              <div className="mb-10">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-6 tracking-[-0.01em]">Everything in Free, plus:</p>
                <ul className="space-y-4">
                  <li className="flex items-center text-[15px]">
                    <div className="w-1 h-1 bg-black dark:bg-white rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-zinc-700 dark:text-zinc-300">Unlimited searches</span>
                  </li>
                  <li className="flex items-center text-[15px]">
                    <div className="w-1 h-1 bg-black dark:bg-white rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-zinc-700 dark:text-zinc-300">All AI models</span>
                  </li>
                  <li className="flex items-center text-[15px]">
                    <div className="w-1 h-1 bg-black dark:bg-white rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-zinc-700 dark:text-zinc-300">Priority support</span>
                  </li>
                  <li className="flex items-center text-[15px]">
                    <div className="w-1 h-1 bg-black dark:bg-white rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-zinc-700 dark:text-zinc-300">Early access to features</span>
                  </li>
                </ul>
              </div>

              {isCurrentPlan(STARTER_TIER) ? (
                <div className="space-y-4">
                  <Button
                    className="w-full h-9 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-normal text-sm tracking-[-0.01em] transition-colors duration-200"
                    onClick={handleManageSubscription}
                  >
                    Manage subscription
                  </Button>
                  {subscriptionDetails.subscription && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                      {subscriptionDetails.subscription.cancelAtPeriodEnd
                        ? `Expires ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`
                        : `Renews ${formatDate(subscriptionDetails.subscription.currentPeriodEnd)}`}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full h-9 bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black group font-normal text-sm tracking-[-0.01em] transition-all duration-200"
                  onClick={() => handleCheckout(STARTER_TIER, STARTER_SLUG)}
                >
                  {isAuthenticated === false ? "Sign in to upgrade" : "Upgrade to Scira Pro"}
                  <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Terms Notice */}
        <div className="text-center mt-16 mb-8">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-6 py-4 inline-block">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              By subscribing, you agree to our{" "}
              <Link href="/terms" className="text-black dark:text-white font-medium hover:underline underline-offset-4 transition-colors duration-200">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Have questions?{" "}
            <a href="mailto:zaid@scira.ai" className="text-black dark:text-white hover:underline underline-offset-4 decoration-zinc-400 dark:decoration-zinc-600 transition-colors duration-200">
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}