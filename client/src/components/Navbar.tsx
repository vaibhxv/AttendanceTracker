import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, User, Plus, Calendar } from "lucide-react";
import AddTimetableForm from "./AddTimetableForm";
import MarkHolidayForm from "./MarkHolidayForm";
interface UserData {
  name: string;
  email: string;
  role: string;
}

// types.ts
export interface AuthProps {
  token: string | null;
  setToken: (token: string | null) => void;
}

export default function Navbar({ token, setToken }: AuthProps) {
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:8080/api/auth/me', {
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
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">Attendance</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {token && userData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline ml-2 lg:inline">Add New</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowTimetableModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Timetable
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowHolidayModal(true)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Mark Holiday
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {token && userData ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {userData.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => window.location.href = '/login'}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {token && userData && (
        <>
          <Dialog open={showTimetableModal} onOpenChange={setShowTimetableModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timetable</DialogTitle>
              </DialogHeader>
              <AddTimetableForm onSuccess={() => setShowTimetableModal(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Holiday</DialogTitle>
              </DialogHeader>
              <MarkHolidayForm onSuccess={() => setShowHolidayModal(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </nav>
  );
}