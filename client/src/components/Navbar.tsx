import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, User, Plus, Calendar, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import AddTimetableForm from "./AddTimetableForm";
import MarkHolidayForm from "./MarkHolidayForm";

interface UserData {
  name: string;
  email: string;
  role: string;
}

export interface AuthProps {
  token: string | null;
  setToken: (token: string | null) => void;
}

export default function Navbar({ token, setToken }: AuthProps) {
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(response.data);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
    };
    fetchUserData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUserData(null);
    navigate('/login');
  };

  return (
    <nav className={cn(
      "w-full z-50 transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40" 
        : "bg-background border-b border-border/10"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <ClipboardList className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
             
            </h1>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {token && userData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline ml-2 lg:inline">Add New</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent 
                  align="end"
                  className="w-48 animate-in fade-in-0 zoom-in-95"
                >
                  <DropdownMenuItem 
                    onClick={() => setShowTimetableModal(true)}
                    className="group cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Add Timetable
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowHolidayModal(true)}
                    className="group cursor-pointer"
                  >
                    <Calendar className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Mark Holiday
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {token && userData ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    className="flex items-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">{userData.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  className="w-56 animate-in fade-in-0 zoom-in-95"
                >
                  <div className="px-2 py-2.5 mb-2">
                    <p className="text-sm font-medium">{userData.name}</p>
                    <p className="text-xs text-muted-foreground">{userData.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer group"
                  >
                    <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default"
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {token && userData && (
        <>
          <Dialog open={showTimetableModal} onOpenChange={setShowTimetableModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add Timetable</DialogTitle>
              </DialogHeader>
              <AddTimetableForm onSuccess={() => setShowTimetableModal(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Mark Holiday</DialogTitle>
              </DialogHeader>
              <MarkHolidayForm onSuccess={() => setShowHolidayModal(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </nav>
  );
}