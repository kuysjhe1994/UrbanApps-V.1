import { useState, useEffect } from "react";
import { User, Settings, Bell, Leaf, Trophy, LogOut, Camera, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useARScans } from "@/hooks/useARScans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_plants: string[] | null;
  garden_zones: number;
  total_plants: number;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  notifications_enabled: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { scans } = useARScans();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gardenStats, setGardenStats] = useState({ zones: 0, plants: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<{
    full_name: string;
    experience_level: 'beginner' | 'intermediate' | 'expert';
    notifications_enabled: boolean;
  }>({
    full_name: "",
    experience_level: "beginner",
    notifications_enabled: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchGardenStats();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const fetchGardenStats = async () => {
    if (!user) return;
    
    try {
      // Fetch garden zones count and total plants
      const { data: zones, error: zonesError } = await supabase
        .from('garden_zones')
        .select('plants_count')
        .eq('user_id', user.id);

      if (zonesError) throw zonesError;

      // Fetch AR scans count for tracking
      const { data: scansData, error: scansError } = await supabase
        .from('ar_scans')
        .select('id')
        .eq('user_id', user.id);

      if (scansError) throw scansError;

      const totalZones = zones?.length || 0;
      const totalPlants = zones?.reduce((sum, zone) => sum + (zone.plants_count || 0), 0) || 0;
      const totalARScans = scansData?.length || 0;

      setGardenStats({ zones: totalZones, plants: totalPlants });
      
      // Update profile stats in database with all tracking metrics
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          garden_zones: totalZones,
          total_plants: totalPlants,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      // Log achievement unlocks
      if (totalPlants === 1) {
        toast({
          title: "Achievement Unlocked! 🌱",
          description: "First Plant - You've started your garden journey!"
        });
      } else if (totalPlants === 5) {
        toast({
          title: "Achievement Unlocked! 🏆", 
          description: "Green Thumb - You're becoming a plant expert!"
        });
      } else if (totalZones === 3) {
        toast({
          title: "Achievement Unlocked! 🌿",
          description: "Zone Master - You've mastered space management!"
        });
      } else if (totalARScans === 10) {
        toast({
          title: "Achievement Unlocked! 📱",
          description: "AR Explorer - You've mastered the AR scanner!"
        });
      }
    } catch (error: any) {
      console.error('Error fetching garden stats:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Listen for garden zones changes
    const gardenChannel = supabase
      .channel('garden-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garden_zones',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchGardenStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gardenChannel);
    };
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const profileData: Profile = {
          ...data,
          experience_level: (data.experience_level as 'beginner' | 'intermediate' | 'expert') || 'beginner'
        };
        setProfile(profileData);
        setFormData({
          full_name: data.full_name || "",
          experience_level: (data.experience_level as 'beginner' | 'intermediate' | 'expert') || 'beginner',
          notifications_enabled: data.notifications_enabled
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !formData.full_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter your full name"
      });
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        experience_level: formData.experience_level,
        notifications_enabled: formData.notifications_enabled,
        garden_zones: gardenStats.zones,
        total_plants: gardenStats.plants,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully"
      });

      setEditing(false);
      await fetchProfile();
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "See you next time!"
    });
  };

  const getExperienceBadge = (level: string) => {
    switch (level) {
      case 'beginner': return { variant: 'secondary' as const, icon: '🌱' };
      case 'intermediate': return { variant: 'default' as const, icon: '🌿' };
      case 'expert': return { variant: 'default' as const, icon: '🌳' };
      default: return { variant: 'secondary' as const, icon: '🌱' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your garden preferences</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="bg-gradient-card shadow-card border border-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">
                  {profile?.full_name || user?.email || "Garden Enthusiast"}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getExperienceBadge(profile?.experience_level || 'beginner').variant}>
                    {getExperienceBadge(profile?.experience_level || 'beginner').icon} {profile?.experience_level || 'beginner'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(!editing)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats - Real-time synchronized */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-black">{gardenStats.zones}</p>
              <p className="text-xs text-muted-foreground dark:text-black/80">Garden Zones</p>
            </div>
            <div className="text-center p-3 bg-accent/5 rounded-lg">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-black">{gardenStats.plants}</p>
              <p className="text-xs text-muted-foreground dark:text-black/80">Total Plants</p>
            </div>
            <div className="text-center p-3 bg-ar-green/5 rounded-lg">
              <div className="w-8 h-8 bg-ar-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="w-4 h-4 text-ar-green" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-black">{scans.length}</p>
              <p className="text-xs text-muted-foreground dark:text-black/80">AR Scans</p>
            </div>
          </div>

          {/* Profile Settings */}
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value: any) => setFormData(prev => ({...prev, experience_level: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Beginner</SelectItem>
                    <SelectItem value="intermediate">🌿 Intermediate</SelectItem>
                    <SelectItem value="expert">🌳 Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get alerts for plant care</p>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, notifications_enabled: checked}))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={updateProfile} 
                  className="flex-1 bg-gradient-primary"
                  disabled={saving || !formData.full_name.trim()}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  onClick={() => {
                    setEditing(false);
                    // Reset form data to current profile
                    if (profile) {
                      setFormData({
                        full_name: profile.full_name || "",
                        experience_level: profile.experience_level,
                        notifications_enabled: profile.notifications_enabled
                      });
                    }
                  }} 
                  variant="outline" 
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Push Notifications</span>
                </div>
                <Badge variant={profile?.notifications_enabled ? "default" : "secondary"}>
                  {profile?.notifications_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Experience Level</span>
                </div>
                <Badge variant={getExperienceBadge(profile?.experience_level || 'beginner').variant}>
                  {getExperienceBadge(profile?.experience_level || 'beginner').icon} {profile?.experience_level || 'beginner'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-card/80 backdrop-blur-sm shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg text-center ${gardenStats.plants > 0 ? 'bg-primary/10' : 'bg-muted/30 opacity-50'}`}>
              <div className="text-2xl mb-1">🌱</div>
              <p className="text-sm font-medium text-foreground">First Plant</p>
              <p className="text-xs text-muted-foreground">
                {gardenStats.plants > 0 ? 'Completed!' : 'Add your first plant'}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${gardenStats.plants >= 5 ? 'bg-accent/10' : 'bg-muted/30 opacity-50'}`}>
              <div className="text-2xl mb-1">🏆</div>
              <p className="text-sm font-medium text-foreground">Green Thumb</p>
              <p className="text-xs text-muted-foreground">
                {gardenStats.plants >= 5 ? 'Achieved!' : `${gardenStats.plants}/5 plants`}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${scans.length >= 10 ? 'bg-ar-green/10' : 'bg-muted/30 opacity-50'}`}>
              <div className="text-2xl mb-1">📱</div>
              <p className="text-sm font-medium text-foreground">AR Explorer</p>
              <p className="text-xs text-muted-foreground">
                {scans.length >= 10 ? 'Completed!' : `${scans.length}/10 scans`}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${gardenStats.zones >= 3 ? 'bg-primary/10' : 'bg-muted/30 opacity-50'}`}>
              <div className="text-2xl mb-1">🌿</div>
              <p className="text-sm font-medium text-foreground">Zone Master</p>
              <p className="text-xs text-muted-foreground">
                {gardenStats.zones >= 3 ? 'Achieved!' : `${gardenStats.zones}/3 zones`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;