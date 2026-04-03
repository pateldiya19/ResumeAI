'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import type { ProjectInput } from '@/types/project';

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
    } else {
      await createProject(data);
    }
    setSaving(false);
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
          style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
        >
          + Add Project
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Project' : 'Add Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack (comma-separated)</label>
                <input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Live URL</label>
                  <input
                    type="url"
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(160, 84%, 39%)' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No projects yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-5 relative">
              {/* Highlight star */}
              <button
                onClick={() => toggleHighlight(p._id)}
                className="absolute top-4 right-4 text-lg"
                title={p.isHighlighted ? 'Remove highlight' : 'Highlight project'}
              >
                {p.isHighlighted ? (
                  <span style={{ color: 'hsl(45, 93%, 47%)' }}>&#9733;</span>
                ) : (
                  <span className="text-gray-300 hover:text-gray-400">&#9734;</span>
                )}
              </button>

              <h3 className="text-lg font-semibold text-gray-900 pr-8">{p.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>

              {p.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.techStack.map((t, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: 'hsl(160, 84%, 39%)' }}>
                    Live Demo
                  </a>
                )}
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gray-500 hover:text-gray-700">
                    GitHub
                  </a>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => openEdit(p._id)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this project?')) deleteProject(p._id);
                  }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
