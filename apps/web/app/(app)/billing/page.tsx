import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const currentPlan = session.user.plan || "free";
  const renewalDate = "February 28, 2025";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-2 text-lg text-gray-600">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{currentPlan} Plan</h2>
            <p className="text-gray-600 mt-2">
              Your subscription renews on <span className="font-semibold text-gray-900">{renewalDate}</span>
            </p>
          </div>
          <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-full text-sm">
            Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">$29<span className="text-lg text-gray-600">/mo</span></p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Billing Cycle</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">Monthly</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold text-green-600 mt-2">Paid</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
            Upgrade Plan
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "$0",
              period: "/month",
              description: "Perfect for beginners",
              features: ["5 applications/day", "Basic analytics", "Email support"]
            },
            {
              name: "Professional",
              price: "$29",
              period: "/month",
              description: "Most popular",
              features: ["50 applications/day", "Advanced analytics", "Priority support", "Custom cover letters", "API access"]
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "",
              description: "For large teams",
              features: ["Unlimited applications", "Custom integrations", "Dedicated support", "Team management", "White label"]
            }
          ].map((plan) => (
            <div
              key={plan.name}
              className={`card ${
                plan.name === "Professional" ? "ring-2 ring-blue-600 relative" : ""
              }`}
            >
              {plan.name === "Professional" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <button
                className={`w-full py-3 font-semibold rounded-lg transition-all duration-200 mb-6 ${
                  plan.name === "Professional"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.name === "Professional" ? "Current Plan" : "Upgrade"}
              </button>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-600 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Billing History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-900">Date</th>
                <th className="text-left py-3 font-semibold text-gray-900">Description</th>
                <th className="text-left py-3 font-semibold text-gray-900">Amount</th>
                <th className="text-left py-3 font-semibold text-gray-900">Status</th>
                <th className="text-center py-3 font-semibold text-gray-900">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Jan 28, 2025", desc: "Monthly subscription", amount: "$29.00", status: "Paid" },
                { date: "Dec 28, 2024", desc: "Monthly subscription", amount: "$29.00", status: "Paid" },
                { date: "Nov 28, 2024", desc: "Monthly subscription", amount: "$29.00", status: "Paid" }
              ].map((invoice, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 text-gray-900">{invoice.date}</td>
                  <td className="py-4 text-gray-600">{invoice.desc}</td>
                  <td className="py-4 font-semibold text-gray-900">{invoice.amount}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h2>
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Visa ending in 4242</p>
              <p className="text-sm text-gray-600">Expires 12/2026</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              Default
            </span>
          </div>
        </div>
        <button className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200">
          Add Payment Method
        </button>
      </div>
    </div>
  );
}
