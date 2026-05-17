import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AdminApp from './admin/AdminApp';
import './App.css';
import Navbar from './components/Navbar';
import TrustBar from './components/TrustBar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import FlashDeals from './components/FlashDeals';
import NewArrivals from './components/NewArrivals';
import BestSellers from './components/BestSellers';
import FeaturedProducts from './components/FeaturedProducts';
import PromoBanner from './components/PromoBanner';
import RecentlyViewed from './components/RecentlyViewed';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function HomePage() {
    return (
        <>
            <TrustBar />
            <Hero />
            <Categories />
            <FlashDeals />
            <NewArrivals />
            <BestSellers />
            <FeaturedProducts />
            <PromoBanner />
            <RecentlyViewed />
            <WhyChooseUs />
            <Testimonials />
            <Newsletter />
        </>
    );
}

/* Auth modals render ON TOP of the homepage */
function AuthModal() {
    const location = useLocation();
    return (
        <>
            {location.pathname === '/login' && <LoginPage />}
            {location.pathname === '/register' && <RegisterPage />}
        </>
    );
}

function AppContent() {
    const location = useLocation();
    const adminShell = location.pathname.startsWith('/admin');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            {!adminShell && <Navbar />}
            <main>
                <Routes>
                    <Route path="/admin/*" element={<AdminApp />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/category" element={<CategoryPage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    {/* Login/Register show homepage underneath */}
                    <Route path="/login" element={<HomePage />} />
                    <Route path="/register" element={<HomePage />} />
                </Routes>
            </main>
            {!adminShell && <Footer />}
            {!adminShell && <AuthModal />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <AppContent />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
