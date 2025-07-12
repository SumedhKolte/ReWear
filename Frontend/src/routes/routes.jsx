// src/routes/routes.jsx
import { Routes, Route } from 'react-router-dom';
import UserLandingPage from '../Pages/UserLandingPage';
import NotFound from '../Pages/Error Pages/NotFound'; // optional 404 fallback
import Signup from '../Pages/Auth/signup'; // Import the signup page
import ItemListingPage from '../Pages/itemlisting';
import UserDashboard from "../Pages/userdashboard"
import Items from "../Pages/itemspage"
import ProductDetailPage from "../Pages/productdetailspage"
import AdminPanel from "../Pages/adminpage"
import SwapInterface from "../Pages/Swapinterface"



export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UserLandingPage />} />
      <Route path="*" element={<NotFound />} />      
      <Route path="/signup" element={<Signup />} />   
      <Route path="/ItemListing" element={<ItemListingPage />} />   
      <Route path="/UserDashboard" element={<UserDashboard />} />    
      <Route path="/Items" element={<Items />} />    
      <Route path="/ProductDetailPage" element={<ProductDetailPage />} />    
      <Route path="/AdminPanel" element={<AdminPanel />} />    
      <Route path="/SwapInterface" element={<SwapInterface />} />    
    </Routes>
  //  <Items />
  );
}