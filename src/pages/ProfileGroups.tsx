import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Trash2, Edit, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, Profile } from "@/lib/api";

export interface ProfileGroup {
  id: string;
  name: string;
  profiles: string[];
  messages: { [profileName: string]: string };
}

const ProfileGroups = () => {
  const [groups, setGroups] = useState<ProfileGroup[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProfileGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [profileMessages, setProfileMessages] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
    loadProfiles();
  }, []);

  const loadGroups = () => {
    const stored = localStorage.getItem('profile_groups');
    if (stored) {
      try {
        setGroups(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профили",
        variant: "destructive",
      });
    }
  };

  const saveGroups = (newGroups: ProfileGroup[]) => {
    localStorage.setItem('profile_groups', JSON.stringify(newGroups));
    setGroups(newGroups);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название группы",
        variant: "destructive",
      });
      return;
    }

    if (selectedProfiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы один профиль",
        variant: "destructive",
      });
      return;
    }

    const newGroup: ProfileGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      profiles: selectedProfiles,
      messages: profileMessages,
    };

    saveGroups([...groups, newGroup]);
    
    toast({
      title: "Успешно!",
      description: `Группа "${newGroupName}" создана`,
    });

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup) return;

    const updatedGroups = groups.map(g => 
      g.id === editingGroup.id 
        ? { ...g, profiles: selectedProfiles, messages: profileMessages }
        : g
    );

    saveGroups(updatedGroups);
    
    toast({
      title: "Успешно!",
      description: `Группа "${editingGroup.name}" обновлена`,
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    saveGroups(groups.filter(g => g.id !== groupId));
    
    toast({
      title: "Удалено",
      description: `Группа "${group?.name}" удалена`,
    });
  };

  const handleEditGroup = (group: ProfileGroup) => {
    setEditingGroup(group);
    setSelectedProfiles(group.profiles);
    setProfileMessages(group.messages);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewGroupName("");
    setSelectedProfiles([]);
    setProfileMessages({});
  };

  const handleProfileToggle = (profileName: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileName) 
        ? prev.filter(p => p !== profileName)
        : [...prev, profileName]
    );
  };

  const handleMessageChange = (profileName: string, message: string) => {
    setProfileMessages(prev => ({ ...prev, [profileName]: message }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Группы профилей
              </CardTitle>
              <CardDescription>
                Создавайте группы профилей для быстрой массовой рассылки
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать группу
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать новую группу</DialogTitle>
                  <DialogDescription>
                    Выберите профили и настройте сообщения для группы
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Название группы</Label>
                    <Input
                      placeholder="Лучшие профили"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Профили и сообщения</Label>
                    <div className="space-y-3">
                      {profiles.map((profile) => (
                        <Card key={profile.name} className="border-border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`new-${profile.name}`}
                                checked={selectedProfiles.includes(profile.name)}
                                onCheckedChange={() => handleProfileToggle(profile.name)}
                              />
                              <Label
                                htmlFor={`new-${profile.name}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {profile.name}
                              </Label>
                            </div>
                            {selectedProfiles.includes(profile.name) && (
                              <Textarea
                                placeholder={`Сообщение для ${profile.name}...`}
                                value={profileMessages[profile.name] || ""}
                                onChange={(e) => handleMessageChange(profile.name, e.target.value)}
                                className="min-h-[80px] resize-none"
                              />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleCreateGroup}>
                    Создать группу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет групп профилей</p>
              <p className="text-sm mt-2">Создайте группу для быстрой массовой рассылки</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <Card key={group.id} className="border-border bg-secondary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.profiles.length} {group.profiles.length === 1 ? 'профиль' : 'профилей'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.profiles.map((profileName) => (
                            <span
                              key={profileName}
                              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                            >
                              {profileName}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать группу: {editingGroup?.name}</DialogTitle>
            <DialogDescription>
              Измените профили и сообщения в группе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Профили и сообщения</Label>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <Card key={profile.name} className="border-border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${profile.name}`}
                          checked={selectedProfiles.includes(profile.name)}
                          onCheckedChange={() => handleProfileToggle(profile.name)}
                        />
                        <Label
                          htmlFor={`edit-${profile.name}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {profile.name}
                        </Label>
                      </div>
                      {selectedProfiles.includes(profile.name) && (
                        <Textarea
                          placeholder={`Сообщение для ${profile.name}...`}
                          value={profileMessages[profile.name] || ""}
                          onChange={(e) => handleMessageChange(profile.name, e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleUpdateGroup}>
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileGroups;