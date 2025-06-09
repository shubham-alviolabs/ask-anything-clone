
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Database, BarChart3 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Model {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string | null;
  usage_count: number | null;
  created_at: string;
}

interface Analytics {
  id: string;
  action: string;
  created_at: string;
  metadata: any;
}

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [profile, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, modelsRes, analyticsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('models').select('*').order('created_at', { ascending: false }),
        supabase.from('usage_analytics').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (modelsRes.data) setModels(modelsRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Models</p>
                <p className="text-3xl font-bold">{models.length}</p>
              </div>
              <Database className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Total Usage</p>
                <p className="text-3xl font-bold">{analytics.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 backdrop-blur-xl border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-500">
              Users
            </TabsTrigger>
            <TabsTrigger value="models" className="text-white data-[state=active]:bg-purple-500">
              Models
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-500">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Management</h3>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-300">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.is_admin && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                            Admin
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-green-500/20 text-green-300">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Model Management</h3>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-gray-300">{model.description}</p>
                        <p className="text-xs text-gray-400">
                          Type: {model.type} • Usage: {model.usage_count || 0}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`border-${model.status === 'active' ? 'green' : 'gray'}-500/20 text-${model.status === 'active' ? 'green' : 'gray'}-300`}
                      >
                        {model.status || 'active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Usage Analytics</h3>
                <div className="space-y-4">
                  {analytics.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{item.action}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-blue-500/20 text-blue-300">
                        {item.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
