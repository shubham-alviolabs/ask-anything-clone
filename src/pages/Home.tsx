
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchInterface } from '@/components/SearchInterface';
import { Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/59308f36-8f34-4d65-9847-07f6d15dc8eb.png" 
              alt="Alvio" 
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Alvio
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              Welcome, {profile?.full_name || profile?.email}
              {profile?.is_admin && (
                <Shield className="inline-block w-4 h-4 ml-2 text-yellow-400" />
              )}
            </div>
            
            {profile?.is_admin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <SearchInterface />
    </div>
  );
}
