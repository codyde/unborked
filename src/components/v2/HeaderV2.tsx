import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bug, ShoppingCart, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const HeaderV2: React.FC = () => {
  const { state } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="bg-[#000000] py-4 px-6 sticky top-0 z-50 border-b border-[#FF0000]/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-[#000000] flex items-center justify-center border border-[#FF0000] rounded group-hover:border-[#CC0000] transition-colors duration-300 relative">
            <Bug className="w-6 h-6 text-[#FF0000] group-hover:text-[#CC0000] transition-colors duration-300" />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded bg-[#FF0000]/20 group-hover:bg-[#CC0000]/20 blur-sm -z-10"></div>
          </div>
          <span className="text-2xl font-bold text-[#FF0000] group-hover:text-[#CC0000] transition-colors duration-300">UNBORKED</span>
        </Link>
        
        {isMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-[#000000] p-4 border-b border-[#FF0000]/30">
            {/* Mobile menu items can be added here if needed */}
          </nav>
        )}

        <div className="flex items-center space-x-4">
          <Link
            to="/cart"
            className="relative p-2.5 bg-[#000000] border border-[#FF0000] hover:border-[#CC0000] transition-colors duration-300 group"
          >
            <ShoppingCart className="w-6 h-6 text-[#FF0000] group-hover:text-[#CC0000] transition-colors duration-300" />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#FF0000]/10 group-hover:bg-[#CC0000]/10 -z-10 blur-sm"></div>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#CC0000] text-white border border-[#CC0000] w-6 h-6 flex items-center justify-center text-xs font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center space-x-1 text-[#FF0000] bg-[#000000] border border-[#FF0000] px-4 py-1.5 hover:text-[#CC0000] hover:border-[#CC0000] transition-colors duration-300 group"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <User className="w-5 h-5" />
                <span className="hidden md:block">{user?.username}</span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[#FF0000]/10 group-hover:bg-[#CC0000]/10 -z-10 blur-sm"></div>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#000000] border border-[#FF0000] py-1 text-[#FF0000] z-50">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm hover:bg-[#FF0000]/10 hover:text-[#CC0000]"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    LOGOUT
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1 text-[#FF0000] bg-[#000000] border border-[#FF0000] px-4 py-1.5 hover:text-[#CC0000] hover:border-[#CC0000] transition-colors duration-300 group relative"
            >
              <LogIn className="w-5 h-5" />
              <span className="hidden md:block">LOGIN</span>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#FF0000]/10 group-hover:bg-[#CC0000]/10 -z-10 blur-sm"></div>
            </Link>
          )}

          <button 
            className="md:hidden bg-[#000000] border border-[#FF0000] p-1.5 hover:border-[#CC0000] transition-colors duration-300 group relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-[#FF0000] group-hover:text-[#CC0000]" />
            ) : (
              <Menu className="w-6 h-6 text-[#FF0000] group-hover:text-[#CC0000]" />
            )}
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#FF0000]/10 group-hover:bg-[#CC0000]/10 -z-10 blur-sm"></div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderV2; 