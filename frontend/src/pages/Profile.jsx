import { useState } from "react";
import { UserCircle, Mail, Shield, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "Procurement Manager",
    email: "manager@sourcewise.ai",
    company: "SourceWise",
    role: "Admin",
  });

  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  function saveProfile(e) {
    e.preventDefault();
    toast.success("Profile updated successfully");
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Profile
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your account settings.
        </p>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex items-center gap-6 mb-10">

          <UserCircle
            size={80}
            className="text-blue-600"
          />

          <div>

            <h2 className="text-2xl font-semibold">
              {profile.name}
            </h2>

            <p className="text-gray-500">
              {profile.role}
            </p>

          </div>

        </div>

        <form
          onSubmit={saveProfile}
          className="space-y-6"
        >

          <div>

            <label className="block font-semibold mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Email
            </label>

            <div className="relative">

              <Mail
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />

              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 pl-10"
              />

            </div>

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Company
            </label>

            <input
              type="text"
              name="company"
              value={profile.company}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Role
            </label>

            <div className="relative">

              <Shield
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />

              <input
                type="text"
                name="role"
                value={profile.role}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 pl-10"
              />

            </div>

          </div>

          <button
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
          >
            <Save size={18} />
            Save Changes
          </button>

        </form>

      </div>

    </div>
  );
}