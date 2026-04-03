'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, ExternalLink, Star, Pencil, Trash2, FolderKanban, Github } from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import type { ProjectInput } from '@/types/project';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { cn } from '@/lib/cn';

const emptyProject: ProjectInput = {
  title: '',
  description: '',
  techStack: [],
  liveUrl: '',
  githubUrl: '',
  isHighlighted: false,
};

export default function ProjectsPage() {
  const { projects, isLoading, createProject, updateProject, deleteProject, toggleHighlight } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyProject);
  const [techInput, setTechInput] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProject);
    setTechInput('');
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const p = projects.find((pr) => pr._id === id);
    if (!p) return;
    setEditingId(id);
    setForm({
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      liveUrl: p.liveUrl || '',
      githubUrl: p.githubUrl || '',
      isHighlighted: p.isHighlighted,
    });
    setTechInput(p.techStack.join(', '));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: ProjectInput = {
      ...form,
      techStack: techInput.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (editingId) {
      await updateProject(editingId, data);
      toast.success('Project updated');
    } else {
      await createProject(data);
      toast.success('Project created');
    }
    setSaving(false);
    setShowForm(false);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {projects.length}/20 projects · Highlighted projects are included in AI resumes
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>

        {/* Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Project' : 'Add Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="My awesome project"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description *</label>
                <Textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this project do?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tech Stack (comma-separated)</label>
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Live URL</label>
                  <Input
                    type="url"
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">GitHub URL</label>
                  <Input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Project Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FolderKanban className="w-7 h-7" />}
              title="No projects yet"
              description="Add your portfolio projects to include them in AI-optimized resumes."
              actionLabel="Add Your First Project"
              actionHref="#"
            />
          </Card>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <StaggerItem key={p._id}>
                <Card className="hover:shadow-md transition-all group relative">
                  <CardContent className="p-5">
                    {/* Star */}
                    <button
                      onClick={() => {
                        toggleHighlight(p._id);
                        toast.success(p.isHighlighted ? 'Removed from highlights' : 'Added to highlights');
                      }}
                      className="absolute top-4 right-4"
                      title={p.isHighlighted ? 'Remove highlight' : 'Highlight project'}
                    >
                      <motion.div whileTap={{ scale: 1.3 }}>
                        <Star
                          className={cn(
                            'w-5 h-5 transition-colors',
                            p.isHighlighted
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 hover:text-gray-300'
                          )}
                        />
                      </motion.div>
                    </button>

                    <h3 className="text-base font-semibold text-gray-900 pr-8 mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>

                    {p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.techStack.map((t, i) => (
                          <Badge key={i} variant="default" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                          <ExternalLink className="w-3 h-3" /> Live Demo
                        </a>
                      )}
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                          <Github className="w-3 h-3" /> GitHub
                        </a>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => openEdit(p._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this project?')) {
                            deleteProject(p._id);
                            toast.success('Project deleted');
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
