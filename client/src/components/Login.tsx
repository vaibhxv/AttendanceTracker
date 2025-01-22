import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SparklesCore } from './ui/sparkles';
import { motion } from 'framer-motion';
import RippleWaveLoader from './ui/RippleWaveLoader';

export interface AuthProps {
  setToken: (token: string) => void;
}

export default function Login({ setToken }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State to manage loading
  const { toast } = useToast();

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    try {
      const response = await axios.post(`${import.meta.env.VITE_APP_BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      setToken(token);

      // Simulate a delay for the loader (optional)
      setTimeout(() => {
        setIsLoading(false); // Stop loading
        navigate('/dashboard'); // Redirect to dashboard
      }, 1000); // Adjust delay as needed
    } catch (error) {
      setIsLoading(false); // Stop loading on error
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-12 items-center justify-center bg-background">
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="w-full px-4">
          <Card className="w-full max-w-md mx-auto shadow-xl">
            <CardHeader className="space-y-2">
              <motion.h1
                className="bg-gradient-to-br from-slate-300 to-slate-900 bg-clip-text text-center text-4xl font-semibold tracking-tight text-transparent"
              >
                Welcome back!
              </motion.h1>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-white text-black hover:bg-white/90 flex px-4" // Flex layout with justify-between
                  disabled={isLoading} // Disable button while loading
                >
                  <span>Login</span> {/* "Login" text on the left */}
                  {isLoading && (
                    <div className="ml-2"> {/* Loader on the extreme right */}
                      <RippleWaveLoader />
                    </div>
                  )}
                </Button>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <span className="text-sm text-gray-600">
                    Don't have an account?
                  </span>
                  <Button
                    onClick={() => navigate('/signup')}
                    variant="ghost"
                    className="h-auto py-1 px-3 text-sm font-medium"
                  >
                    Sign up
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="w-full justify-items-center max-w-4xl h-40 relative">
          {/* Gradients */}
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />

          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>
      </div>
    </div>
  );
}