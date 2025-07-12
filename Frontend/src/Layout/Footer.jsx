import React from 'react';
import { Recycle, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => (
  <footer className="bg-stone-800 text-white py-12 sm:py-16">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-1.5 rounded-lg">
              <Recycle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">ReWear</span>
          </div>
          <p className="text-stone-300 mb-6 max-w-md">
            Making sustainable fashion accessible to everyone. Join the circular fashion revolution and help us build a more sustainable future.
          </p>
          <div className="flex space-x-4">
            <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
              <Instagram className="h-5 w-5" />
            </button>
            <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
              <Facebook className="h-5 w-5" />
            </button>
            <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
              <Twitter className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-orange-400">Shop</h4>
          <ul className="space-y-2 text-stone-300">
            <li><a href="#" className="hover:text-orange-400 transition-colors">Women</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Men</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Accessories</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Vintage</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Designer</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-orange-400">Company</h4>
          <ul className="space-y-2 text-stone-300">
            <li><a href="#" className="hover:text-orange-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Sustainability</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Press</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-orange-400">Support</h4>
          <ul className="space-y-2 text-stone-300">
            <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Shipping</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Returns</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Size Guide</a></li>
            <li><a href="#contact" className="hover:text-orange-400 transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-700 mt-8 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-stone-300 text-sm mb-4 sm:mb-0">
            &copy; 2025 ReWear. All rights reserved. Made with ♻️ for a sustainable future.
          </p>
          <div className="flex items-center space-x-4 text-sm text-stone-300">
            <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
