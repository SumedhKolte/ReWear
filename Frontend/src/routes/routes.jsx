// src/routes/routes.jsx
import { Routes, Route } from 'react-router-dom';
import UserLandingPage from '../Pages/UserLandingPage';
import NotFound from '../Pages/Error Pages/NotFound'; // optional 404 fallback

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UserLandingPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
