import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Settings — Job Agent" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-lg text-gray-600">Manage your account and automation preferences</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {["Profile", "Automation", "Notifications", "Account"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-3 font-medium border-b-2 transition-colors duration-200 ${
                tab === "Profile"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar */}
        <div>
          <div className="card text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {session.user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <h3 className="font-bold text-gray-900">{session.user.email?.split("@")[0]}</h3>
            <p className="text-sm text-gray-500 mt-1">{session.user.email}</p>
            <button className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-200 font-medium text-sm">
              Change Avatar
            </button>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                  <input type="text" placeholder="John" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                <input type="email" value={session.user.email || ""} disabled className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
                <input type="tel" placeholder="+1 (555) 123-4567" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                <input type="text" placeholder="San Francisco, CA" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Bio</label>
                <textarea placeholder="Tell us about yourself..." rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200 resize-none"></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
                  Save Changes
                </button>
                <button className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Automation Rules */}
          <div className="card mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Automation Rules</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Auto-Apply</p>
                  <p className="text-sm text-gray-600">Automatically apply to matching jobs</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded text-blue-600" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">Applications Per Day</label>
                <input type="range" min="1" max="20" defaultValue="5" className="w-full" />
                <p className="text-xs text-gray-600">Maximum: 5 applications per day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Cover Letter Template</label>
                <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors duration-200">
                  <option>Default Template</option>
                  <option>Professional</option>
                  <option>Creative</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
