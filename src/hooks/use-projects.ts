'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ProjectInput, ProjectResponse } from '@/types/project';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (input: ProjectInput): Promise<ProjectResponse | null> => {
    // Optimistic: we add after server confirms since we need the _id
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create project');
      }
      const created = await res.json();
      setProjects((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateProject = async (id: string, input: Partial<ProjectInput>): Promise<ProjectResponse | null> => {
    const prev = projects;
    // Optimistic update
    setProjects((curr) =>
      curr.map((p) => (p._id === id ? { ...p, ...input } : p))
    );
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        setProjects(prev); // rollback
        const err = await res.json();
        throw new Error(err.error || 'Failed to update project');
      }
      const updated = await res.json();
      setProjects((curr) => curr.map((p) => (p._id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    const prev = projects;
    // Optimistic removal
    setProjects((curr) => curr.filter((p) => p._id !== id));
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setProjects(prev); // rollback
        throw new Error('Failed to delete project');
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const toggleHighlight = async (id: string): Promise<void> => {
    const project = projects.find((p) => p._id === id);
    if (!project) return;
    await updateProject(id, { isHighlighted: !project.isHighlighted });
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    toggleHighlight,
    refetch: fetchProjects,
  };
}
