import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Network error:', error);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center justify-center space-x-2">
            <Loader className="h-5 w-5 animate-spin" />
            <span>Sending...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Thank You! We'll be in touch.</span>
          </div>
        );
      case 'error':
        return 'Try Again';
      default:
        return 'Send Message';
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "w-full py-3 rounded-xl font-semibold transition-all duration-200 transform shadow-lg";
    
    switch (status) {
      case 'loading':
        return `${baseStyles} bg-gray-400 text-white cursor-not-allowed`;
      case 'success':
        return `${baseStyles} bg-green-600 text-white`;
      case 'error':
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700 hover:scale-105`;
      default:
        return `${baseStyles} bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 hover:scale-105`;
    }
  };

  return (
    <section id="contact" className="bg-white py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-4">Contact Us</h2>
          <p className="text-stone-600 max-w-xl mx-auto">Have questions or feedback? Reach out and our team will get back to you soon.</p>
        </div>
        
        <div className="bg-stone-50 rounded-2xl shadow-md p-6 sm:p-10">
          {/* Error Message Display */}
          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message Display */}
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">Your message has been sent successfully! We'll get back to you soon.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                value={form.name}
                onChange={handleChange}
                disabled={status === 'loading'}
                className="border border-stone-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                value={form.email}
                onChange={handleChange}
                disabled={status === 'loading'}
                className="border border-stone-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <textarea
              name="message"
              placeholder="Your Message"
              required
              value={form.message}
              onChange={handleChange}
              rows={5}
              disabled={status === 'loading'}
              className="border border-stone-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              className={getButtonStyles()}
              disabled={status === 'loading' || status === 'success'}
            >
              {getButtonContent()}
            </button>
          </form>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-stone-700 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-orange-500" />
              <span>hello@rewear.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-orange-500" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span>San Francisco, CA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
