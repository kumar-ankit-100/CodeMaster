"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Sun, Moon, ChevronDown, LogIn, UserPlus, LogOut, Settings, User, GitPullRequest } from "lucide-react";
import Link from "next/link";
import AuthDialog from "./auth_dialog";
const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const handleLogin = () => {
    setIsAuthOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    setIsDropdownOpen(false);
  };

  return (
    <>
    <header className="sticky top-0 z-10 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
        <Link href="/">

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text"
          >
           

            CodeMaster
          </motion.div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button> */}
          <Link href="/contribute-question">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 text-sm rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition cursor-pointer group"
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 15, 0, -15, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatDelay: 4
                  }}
                  className="mr-2"
                >
                  <GitPullRequest size={18} />
                </motion.div>
                <span>Contribute Question</span>
                <motion.div
                  initial={{ x: 0, opacity: 0 }}
                  whileHover={{ x: 3, opacity: 1 }}
                  className="ml-1"
                >
                  →
                </motion.div>
              </motion.div>
            </Link>
          
          {status === "authenticated" ? (
            <div className="relative">
              <div 
                onClick={toggleDropdown}
                className="flex items-center space-x-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                </div>
                <span>{session.user?.name || session.user?.email || "User"}</span>
                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-900 rounded-md shadow-lg border border-white/10">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium">{session.user?.name || "User"}</p>
                    <p className="text-xs text-gray-400">{session.user?.email}</p>
                  </div>
                  
                  <a href="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-white/10 transition">
                    <User size={16} className="mr-2" />
                    Profile
                  </a>
                  
                  <a href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-white/10 transition">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </a>
                  
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <a onClick={() => setIsAuthOpen(true)} className="flex items-center px-4 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 transition">
                <LogIn size={16} className="mr-2" />
                Sign in

              </a>
                    
              
              
              <a onClick={() => setIsAuthOpen(true)} className="flex items-center px-4 py-2 text-sm rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition">
                <UserPlus size={16} className="mr-2" />
                Sign up
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
          <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />
          </>
  );
};

export default Navbar;