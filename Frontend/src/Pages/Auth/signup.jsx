import React, { useState } from "react";
import { FaGoogle, FaFacebook, FaLeaf } from "react-icons/fa";
import { MdRecycling } from "react-icons/md";

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-slate-700 font-semibold mb-1">{label}</label>
    <input
      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
      {...props}
    />
  </div>
);

const SocialButton = ({ icon, children, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center w-full py-2 mb-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition ${color}`}
  >
    {icon}
    <span className="ml-2 font-medium">{children}</span>
  </button>
);

const LoginSignupPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    // Add validation and authentication logic here
    if (isRegister && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // Simulate success
    alert(isRegister ? "Registration successful!" : "Login successful!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <MdRecycling className="text-emerald-600 text-5xl mb-2" />
          <h1 className="text-3xl font-bold text-slate-800 mb-1">ReWear</h1>
          <span className="text-emerald-600 font-medium">Sustainable Fashion</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
          {isRegister ? "Create your account" : "Welcome back! Login"}
        </h2>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <Input
                label="Full Name"
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </>
          )}
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          {isRegister && (
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          )}
          {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition mb-4"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-slate-200" />
          <span className="mx-2 text-slate-400 text-sm">or</span>
          <hr className="flex-grow border-slate-200" />
        </div>
        <SocialButton
          icon={<FaGoogle className="text-red-500" />}
          color="hover:border-red-300"
        >
          Continue with Google
        </SocialButton>
        <SocialButton
          icon={<FaFacebook className="text-blue-600" />}
          color="hover:border-blue-300"
        >
          Continue with Facebook
        </SocialButton>
        <div className="mt-6 text-center">
          <span className="text-slate-600 text-sm">
            {isRegister ? "Already have an account?" : "First time here?"}
          </span>
          <button
            className="ml-2 text-emerald-600 font-semibold hover:underline"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center text-slate-500 text-xs gap-1">
          <FaLeaf className="text-lime-500" />
          <span>
            Join ReWear and help reduce fashion waste. Every login makes a difference!
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupPage;
