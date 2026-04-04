'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Save, Plus, Trash2, Briefcase, GraduationCap, User, FileText,
  ArrowLeft, Loader2, AlertTriangle, Download, ChevronUp, ChevronDown,
  GripVertical, Phone, Mail, MapPin, Award, FolderKanban, Search, PenLine,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';

interface Section {
  id: string;
  type: 'contact' | 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'custom';
  title: string;
  visible: boolean;
}

interface ExperienceItem {
  company: string; title: string; startDate: string; endDate: string; bullets: string[];
}
interface EducationItem {
  institution: string; degree: string; field: string; startDate: string; endDate: string;
}
interface ProjectItem {
  title: string; description: string; techStack: string[]; link: string;
}

interface ResumeData {
  name: string; headline: string; email: string; phone: string; city: string;
  summary: string; skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  projects: ProjectItem[];
  customSections: Array<{ title: string; content: string }>;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'contact', type: 'contact', title: 'Contact Info', visible: true },
  { id: 'summary', type: 'summary', title: 'Summary', visible: true },
  { id: 'skills', type: 'skills', title: 'Skills', visible: true },
  { id: 'experience', type: 'experience', title: 'Experience', visible: true },
  { id: 'education', type: 'education', title: 'Education', visible: true },
  { id: 'certifications', type: 'certifications', title: 'Certifications', visible: true },
  { id: 'projects', type: 'projects', title: 'Projects', visible: true },
];

export default function ResumeEditorPage() {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [atsFixes, setAtsFixes] = useState<string[]>([]);
  const [savedProjects, setSavedProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.parsedResume) {
          const pr = data.parsedResume;
          setResume({
            name: pr.name || '', headline: pr.headline || '',
            email: pr.email || '', phone: pr.phone || '', city: pr.city || '',
            summary: pr.summary || '', skills: pr.skills || [],
            experience: (pr.experience || []).map((e: any) => ({
              company: e.company || '', title: e.title || '',
              startDate: e.startDate || '', endDate: e.endDate || '',
              bullets: Array.isArray(e.bullets) ? e.bullets : [],
            })),
            education: (pr.education || []).map((e: any) => ({
              institution: e.institution || '', degree: e.degree || '',
              field: e.field || '', startDate: e.startDate || '', endDate: e.endDate || '',
            })),
            certifications: pr.certifications || [],
            projects: (pr.projects || []).map((p: any) => ({
              title: p.title || '', description: p.description || '',
              techStack: p.techStack || [], link: p.link || '',
            })),
            customSections: [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load ATS fixes from sessionStorage and apply them
    try {
      const fixes = sessionStorage.getItem('ats-fixes');
      if (fixes) {
        const parsedFixes: string[] = JSON.parse(fixes);
        setAtsFixes(parsedFixes);
        sessionStorage.removeItem('ats-fixes');

        // Auto-apply structural fixes
        setSections((prev) => {
          const updated = [...prev];
          for (const fix of parsedFixes) {
            const lower = fix.toLowerCase();
            // Enable hidden sections that are mentioned in fixes
            if (lower.includes('certification')) {
              const idx = updated.findIndex(s => s.type === 'certifications');
              if (idx >= 0) updated[idx] = { ...updated[idx], visible: true };
            }
            if (lower.includes('project')) {
              const idx = updated.findIndex(s => s.type === 'projects');
              if (idx >= 0) updated[idx] = { ...updated[idx], visible: true };
            }
            if (lower.includes('summary') || lower.includes('objective')) {
              const idx = updated.findIndex(s => s.type === 'summary');
              if (idx >= 0) updated[idx] = { ...updated[idx], visible: true };
            }
            if (lower.includes('skill')) {
              const idx = updated.findIndex(s => s.type === 'skills');
              if (idx >= 0) updated[idx] = { ...updated[idx], visible: true };
            }
          }
          return updated;
        });
      }
    } catch {}

    // Load saved projects
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setSavedProjects(d.map((p: any) => ({ title: p.title, description: p.description, techStack: p.techStack || [], link: p.liveUrl || '' })));
    }).catch(() => {});
  }, []);

  if (loading) return <div className="max-w-7xl mx-auto p-6"><Skeleton className="h-[600px]" /></div>;
  if (!resume) return (
    <PageTransition><div className="max-w-md mx-auto text-center py-20">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">No Resume Found</h2>
      <p className="text-sm text-gray-500 mb-4">Complete onboarding first.</p>
      <Link href="/onboarding"><Button>Go to Onboarding</Button></Link>
    </div></PageTransition>
  );

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr);
  };

  const addCustomSection = () => {
    const id = `custom-${Date.now()}`;
    setSections([...sections, { id, type: 'custom', title: 'New Section', visible: true }]);
    setResume({ ...resume, customSections: [...resume.customSections, { title: 'New Section', content: '' }] });
  };

  const addProjectFromSaved = (proj: ProjectItem) => {
    if (resume.projects.some(p => p.title === proj.title)) { toast.error('Already added'); return; }
    setResume({ ...resume, projects: [...resume.projects, proj] });
    toast.success(`Added "${proj.title}"`);
  };

  const formatResumeText = (): string => {
    let t = `${resume.name}\n${resume.headline}\n`;
    if (resume.email || resume.phone || resume.city) t += `${[resume.email, resume.phone, resume.city].filter(Boolean).join(' | ')}\n`;
    t += '\n';
    for (const sec of sections) {
      if (!sec.visible) continue;
      if (sec.type === 'summary' && resume.summary) t += `SUMMARY\n${resume.summary}\n\n`;
      if (sec.type === 'skills' && resume.skills.length) t += `SKILLS\n${resume.skills.join(', ')}\n\n`;
      if (sec.type === 'experience' && resume.experience.length) {
        t += 'EXPERIENCE\n';
        for (const exp of resume.experience) {
          t += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
          for (const b of exp.bullets) if (b) t += `• ${b}\n`;
          t += '\n';
        }
      }
      if (sec.type === 'education' && resume.education.length) {
        t += 'EDUCATION\n';
        for (const edu of resume.education) t += `${edu.degree} in ${edu.field} — ${edu.institution} (${edu.startDate} - ${edu.endDate})\n`;
        t += '\n';
      }
      if (sec.type === 'certifications' && resume.certifications.length) {
        t += 'CERTIFICATIONS\n';
        for (const c of resume.certifications) t += `• ${c}\n`;
        t += '\n';
      }
      if (sec.type === 'projects' && resume.projects.length) {
        t += 'PROJECTS\n';
        for (const p of resume.projects) t += `${p.title}: ${p.description} [${p.techStack.join(', ')}]\n`;
        t += '\n';
      }
      if (sec.type === 'custom') {
        const cs = resume.customSections.find((_, i) => `custom-${i}` === sec.id || sec.title === _.title);
        if (cs && cs.content) t += `${cs.title.toUpperCase()}\n${cs.content}\n\n`;
      }
    }
    return t;
  };

  // Build structured data for API (preserves editor edits exactly)
  const buildStructuredData = () => ({
    name: resume.name,
    headline: resume.headline,
    email: resume.email,
    phone: resume.phone,
    city: resume.city,
    summary: resume.summary,
    skills: resume.skills,
    experience: resume.experience,
    education: resume.education,
    certifications: resume.certifications,
    projects: resume.projects,
    customSections: resume.customSections,
  });

  // Check which fixes are still unresolved
  const unresolvedFixes = atsFixes.filter((fix) => {
    const lower = fix.toLowerCase();
    if (lower.includes('certification') && resume.certifications.length > 0) return false;
    if (lower.includes('skill') && resume.skills.length >= 3) return false;
    if (lower.includes('summary') && resume.summary.length > 20) return false;
    if (lower.includes('project') && resume.projects.length > 0) return false;
    if (lower.includes('metric') || lower.includes('quantif')) {
      const hasBulletWithNumber = resume.experience.some(e => e.bullets.some(b => /\d/.test(b)));
      if (hasBulletWithNumber) return false;
    }
    if (lower.includes('bullet') && lower.includes('improve')) {
      // Can't auto-detect if bullets were improved, keep showing
      return true;
    }
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        resumeText: formatResumeText(),
        resumeFileName: 'edited-resume',
        parsedResumeData: buildStructuredData(),
        analyze: false,
      };
      console.log('[Editor] Saving resume, text length:', payload.resumeText.length);
      const res = await fetch('/api/user/profile/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Resume saved!');
    } catch (err) {
      console.error('[Editor] Save error:', err);
      toast.error('Network error — could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const payload = {
        resumeText: formatResumeText(),
        resumeFileName: 'edited-resume',
        parsedResumeData: buildStructuredData(),
        analyze: true,
      };
      const res = await fetch('/api/user/profile/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to analyze');
        return;
      }
      toast.success('Resume saved & re-analyzed!');
      router.push('/analyze/resume-check');
    } catch (err) {
      console.error('[Editor] Analyze error:', err);
      toast.error('Network error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    const usable = pageWidth - margin * 2;
    let y = 50;

    const checkPage = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 50;
      }
    };

    const addHeading = (text: string) => {
      checkPage(30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(text.toUpperCase(), margin, y);
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    };

    // Name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(resume.name || 'Your Name', pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Headline
    if (resume.headline) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(resume.headline, pageWidth / 2, y, { align: 'center' });
      y += 16;
    }

    // Contact
    const contactParts = [resume.email, resume.phone, resume.city].filter(Boolean);
    if (contactParts.length) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(contactParts.join('  |  '), pageWidth / 2, y, { align: 'center' });
      y += 20;
    }

    // Sections in order
    for (const sec of sections) {
      if (!sec.visible) continue;

      if (sec.type === 'summary' && resume.summary) {
        addHeading('Summary');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(resume.summary, usable);
        checkPage(lines.length * 14);
        doc.text(lines, margin, y);
        y += lines.length * 14 + 10;
      }

      if (sec.type === 'skills' && resume.skills.length) {
        addHeading('Skills');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const skillText = resume.skills.join('  •  ');
        const lines = doc.splitTextToSize(skillText, usable);
        checkPage(lines.length * 14);
        doc.text(lines, margin, y);
        y += lines.length * 14 + 10;
      }

      if (sec.type === 'experience' && resume.experience.length) {
        addHeading('Experience');
        for (const exp of resume.experience) {
          checkPage(50);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(exp.title || 'Title', margin, y);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          const dateStr = `${exp.startDate} — ${exp.endDate || 'Present'}`;
          doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
          y += 14;
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(exp.company || 'Company', margin, y);
          y += 14;
          doc.setTextColor(60, 60, 60);
          for (const bullet of exp.bullets.filter(Boolean)) {
            const lines = doc.splitTextToSize(`•  ${bullet}`, usable - 10);
            checkPage(lines.length * 13);
            doc.text(lines, margin + 10, y);
            y += lines.length * 13;
          }
          y += 8;
        }
      }

      if (sec.type === 'education' && resume.education.length) {
        addHeading('Education');
        for (const edu of resume.education) {
          checkPage(30);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(edu.institution || 'Institution', margin, y);
          y += 14;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, margin, y);
          if (edu.startDate) {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(`${edu.startDate} — ${edu.endDate}`, pageWidth - margin, y, { align: 'right' });
          }
          y += 16;
        }
      }

      if (sec.type === 'certifications' && resume.certifications.length) {
        addHeading('Certifications');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        for (const cert of resume.certifications) {
          checkPage(14);
          doc.text(`•  ${cert}`, margin + 10, y);
          y += 14;
        }
        y += 6;
      }

      if (sec.type === 'projects' && resume.projects.length) {
        addHeading('Projects');
        for (const proj of resume.projects) {
          checkPage(30);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(proj.title || 'Project', margin, y);
          y += 14;
          if (proj.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(proj.description, usable);
            checkPage(lines.length * 13);
            doc.text(lines, margin, y);
            y += lines.length * 13;
          }
          if (proj.techStack.length) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(proj.techStack.join(', '), margin, y);
            y += 14;
          }
          y += 6;
        }
      }

      if (sec.type === 'custom') {
        const cs = resume.customSections.find(c => c.title === sec.title);
        if (cs?.content) {
          addHeading(cs.title);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(cs.content, usable);
          checkPage(lines.length * 14);
          doc.text(lines, margin, y);
          y += lines.length * 14 + 10;
        }
      }
    }

    doc.save(`${resume.name || 'resume'}.pdf`);
    toast.success('PDF downloaded');
  };

  // Editor section renderers
  const renderSection = (sec: Section, idx: number) => {
    if (!sec.visible) return null;
    return (
      <Card key={sec.id} className="group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">{sec.title}</CardTitle>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => moveSection(idx, -1)} className="p-1 text-gray-300 hover:text-gray-600"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => moveSection(idx, 1)} className="p-1 text-gray-300 hover:text-gray-600"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => { const s = [...sections]; s[idx].visible = false; setSections(s); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sec.type === 'contact' && (
            <div className="space-y-2">
              <Input value={resume.name} onChange={e => setResume({...resume, name: e.target.value})} placeholder="Full Name" />
              <Input value={resume.headline} onChange={e => setResume({...resume, headline: e.target.value})} placeholder="Title / Headline" />
              <div className="grid grid-cols-3 gap-2">
                <div className="relative"><Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.email} onChange={e => setResume({...resume, email: e.target.value})} placeholder="Email" className="pl-8 text-xs" /></div>
                <div className="relative"><Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.phone} onChange={e => setResume({...resume, phone: e.target.value})} placeholder="Phone" className="pl-8 text-xs" /></div>
                <div className="relative"><MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.city} onChange={e => setResume({...resume, city: e.target.value})} placeholder="City" className="pl-8 text-xs" /></div>
              </div>
            </div>
          )}
          {sec.type === 'summary' && <Textarea value={resume.summary} onChange={e => setResume({...resume, summary: e.target.value})} rows={3} className="resize-none text-sm" placeholder="Professional summary..." />}
          {sec.type === 'skills' && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2">{resume.skills.map((s,i) => <Badge key={i} variant="purple" className="gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600" onClick={() => setResume({...resume, skills: resume.skills.filter((_,j)=>j!==i)})}>{s} <Trash2 className="w-2.5 h-2.5" /></Badge>)}</div>
              <div className="flex gap-2"><Input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && newSkill.trim()) { setResume({...resume, skills: [...resume.skills, newSkill.trim()]}); setNewSkill(''); }}} placeholder="Add skill..." className="text-sm" /><Button variant="outline" size="sm" onClick={() => { if (newSkill.trim()) { setResume({...resume, skills: [...resume.skills, newSkill.trim()]}); setNewSkill(''); }}}>Add</Button></div>
            </>
          )}
          {sec.type === 'experience' && (
            <>
              {resume.experience.map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group/exp">
                  <button onClick={() => setResume({...resume, experience: resume.experience.filter((_,j)=>j!==i)})} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/exp:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={exp.title} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],title:e.target.value}; setResume({...resume,experience:x}); }} placeholder="Job Title" className="text-sm" />
                    <Input value={exp.company} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],company:e.target.value}; setResume({...resume,experience:x}); }} placeholder="Company" className="text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="month" value={exp.startDate} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],startDate:e.target.value}; setResume({...resume,experience:x}); }} className="text-xs" />
                    <Input type="month" value={exp.endDate} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],endDate:e.target.value}; setResume({...resume,experience:x}); }} placeholder="Present" className="text-xs" />
                  </div>
                  {exp.bullets.map((b,bi) => (
                    <div key={bi} className="flex gap-1.5 items-start">
                      <span className="text-gray-300 mt-2.5 text-xs">•</span>
                      <Input value={b} onChange={e => { const x=[...resume.experience]; const bl=[...x[i].bullets]; bl[bi]=e.target.value; x[i]={...x[i],bullets:bl}; setResume({...resume,experience:x}); }} className="text-xs flex-1" />
                      <button onClick={() => { const x=[...resume.experience]; x[i]={...x[i],bullets:x[i].bullets.filter((_,j)=>j!==bi)}; setResume({...resume,experience:x}); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => { const x=[...resume.experience]; x[i]={...x[i],bullets:[...x[i].bullets,'']}; setResume({...resume,experience:x}); }} className="text-xs text-brand-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add bullet</button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setResume({...resume, experience: [...resume.experience, {company:'',title:'',startDate:'',endDate:'',bullets:['']}]})} className="text-xs gap-1 w-full"><Plus className="w-3 h-3" /> Add Experience</Button>
            </>
          )}
          {sec.type === 'education' && (
            <>
              {resume.education.map((edu,i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group/edu">
                  <button onClick={() => setResume({...resume, education: resume.education.filter((_,j)=>j!==i)})} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/edu:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  <Input value={edu.institution} onChange={e => { const x=[...resume.education]; x[i]={...x[i],institution:e.target.value}; setResume({...resume,education:x}); }} placeholder="Institution" className="text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={edu.degree} onChange={e => { const x=[...resume.education]; x[i]={...x[i],degree:e.target.value}; setResume({...resume,education:x}); }} placeholder="Degree" className="text-xs" />
                    <Input value={edu.field} onChange={e => { const x=[...resume.education]; x[i]={...x[i],field:e.target.value}; setResume({...resume,education:x}); }} placeholder="Field" className="text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="month" value={edu.startDate} onChange={e => { const x=[...resume.education]; x[i]={...x[i],startDate:e.target.value}; setResume({...resume,education:x}); }} className="text-xs" />
                    <Input type="month" value={edu.endDate} onChange={e => { const x=[...resume.education]; x[i]={...x[i],endDate:e.target.value}; setResume({...resume,education:x}); }} className="text-xs" />
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setResume({...resume, education: [...resume.education, {institution:'',degree:'',field:'',startDate:'',endDate:''}]})} className="text-xs gap-1 w-full"><Plus className="w-3 h-3" /> Add Education</Button>
            </>
          )}
          {sec.type === 'certifications' && (
            <>
              {resume.certifications.map((c,i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Award className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <Input value={c} onChange={e => { const x=[...resume.certifications]; x[i]=e.target.value; setResume({...resume,certifications:x}); }} className="text-xs flex-1" />
                  <button onClick={() => setResume({...resume, certifications: resume.certifications.filter((_,j)=>j!==i)})} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <div className="flex gap-2"><Input value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && newCert.trim()) { setResume({...resume, certifications: [...resume.certifications, newCert.trim()]}); setNewCert(''); }}} placeholder="Add certification..." className="text-xs" /><Button variant="outline" size="sm" onClick={() => { if (newCert.trim()) { setResume({...resume, certifications: [...resume.certifications, newCert.trim()]}); setNewCert(''); }}}>Add</Button></div>
            </>
          )}
          {sec.type === 'projects' && (
            <>
              {resume.projects.map((p,i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group/proj">
                  <button onClick={() => setResume({...resume, projects: resume.projects.filter((_,j)=>j!==i)})} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/proj:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  <Input value={p.title} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],title:e.target.value}; setResume({...resume,projects:x}); }} placeholder="Project Title" className="text-sm" />
                  <Textarea value={p.description} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],description:e.target.value}; setResume({...resume,projects:x}); }} placeholder="Description" rows={2} className="text-xs resize-none" />
                  <Input value={p.techStack.join(', ')} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],techStack:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}; setResume({...resume,projects:x}); }} placeholder="Tech stack (comma separated)" className="text-xs" />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setResume({...resume, projects: [...resume.projects, {title:'',description:'',techStack:[],link:''}]})} className="text-xs gap-1 w-full"><Plus className="w-3 h-3" /> Add Project</Button>
              {savedProjects.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Add from saved projects</p>
                  {savedProjects.slice(0,5).map((sp,i) => (
                    <button key={i} onClick={() => addProjectFromSaved(sp)} className="flex items-center gap-2 w-full text-left text-xs p-2 rounded-lg hover:bg-gray-50 transition">
                      <FolderKanban className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700 truncate">{sp.title}</span>
                      <Plus className="w-3 h-3 text-brand-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {sec.type === 'custom' && (
            <>
              {resume.customSections.filter(cs => cs.title === sec.title || sections.findIndex(s=>s.id===sec.id) >= 0).slice(0,1).map((cs, ci) => (
                <div key={ci} className="space-y-2">
                  <Input value={cs.title} onChange={e => { const x=[...resume.customSections]; const idx = x.findIndex(c=>c.title===sec.title); if(idx>=0) { x[idx]={...x[idx],title:e.target.value}; const s=[...sections]; const si=s.findIndex(ss=>ss.id===sec.id); if(si>=0) s[si]={...s[si],title:e.target.value}; setSections(s); setResume({...resume,customSections:x}); }}} placeholder="Section Title" className="text-sm font-medium" />
                  <Textarea value={cs.content} onChange={e => { const x=[...resume.customSections]; const idx = x.findIndex(c=>c.title===sec.title); if(idx>=0) { x[idx]={...x[idx],content:e.target.value}; setResume({...resume,customSections:x}); }}} placeholder="Content..." rows={3} className="text-xs resize-none" />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Resume Editor</h1>
              <p className="text-xs text-gray-500">Edit fields on the left, preview on the right</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5"><Download className="w-3.5 h-3.5" /> Download</Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
            <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white">
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Analyze
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: Editor */}
          <div className="space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 scrollbar-thin">
            {/* ATS Fixes — reactive: resolved ones get strikethrough */}
            {atsFixes.length > 0 && (
              <Card className={unresolvedFixes.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm flex items-center gap-2 ${unresolvedFixes.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {unresolvedFixes.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <span className="text-emerald-500">&#10003;</span>}
                    {unresolvedFixes.length > 0 ? `${unresolvedFixes.length} issue${unresolvedFixes.length > 1 ? 's' : ''} remaining` : 'All issues fixed!'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {atsFixes.map((fix, i) => {
                    const resolved = !unresolvedFixes.includes(fix);
                    return (
                      <div key={i} className={`flex items-start gap-2 text-xs rounded-lg p-2 transition-all ${resolved ? 'bg-emerald-50 text-emerald-600 line-through opacity-60' : 'bg-amber-50 text-amber-800'}`}>
                        <span className={`shrink-0 ${resolved ? 'text-emerald-500' : 'text-amber-500'}`}>{resolved ? '✓' : '!'}</span>
                        {fix}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Render sections in order */}
            {sections.map((sec, idx) => renderSection(sec, idx))}

            {/* Hidden sections toggle */}
            {sections.some(s => !s.visible) && (
              <div className="border border-dashed border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium mb-2">Hidden sections (click to show)</p>
                <div className="flex flex-wrap gap-1.5">
                  {sections.filter(s => !s.visible).map((s, i) => (
                    <button key={i} onClick={() => { const arr=[...sections]; const idx=arr.findIndex(x=>x.id===s.id); if(idx>=0) arr[idx]={...arr[idx],visible:true}; setSections(arr); }}
                      className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition">{s.title}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Add section */}
            <Button variant="outline" onClick={addCustomSection} className="w-full gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add Custom Section</Button>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-4 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin">
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">{resume.name || 'Your Name'}</h2>
                  <p className="text-sm text-gray-500 mt-1">{resume.headline || 'Professional Title'}</p>
                  {(resume.email || resume.phone || resume.city) && (
                    <p className="text-xs text-gray-400 mt-1.5">{[resume.email, resume.phone, resume.city].filter(Boolean).join(' | ')}</p>
                  )}
                </div>

                {/* Render preview sections in order */}
                {sections.filter(s => s.visible).map((sec) => (
                  <div key={sec.id} className="mb-4">
                    {sec.type === 'summary' && resume.summary && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Summary</h3><p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p></>
                    )}
                    {sec.type === 'skills' && resume.skills.length > 0 && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Skills</h3><div className="flex flex-wrap gap-1.5">{resume.skills.map((s,i) => <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s}</span>)}</div></>
                    )}
                    {sec.type === 'experience' && resume.experience.length > 0 && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</h3>
                      {resume.experience.map((exp,i) => (
                        <div key={i} className="mb-3">
                          <div className="flex items-baseline justify-between"><p className="text-sm font-semibold text-gray-900">{exp.title || 'Title'}</p><p className="text-[10px] text-gray-400">{exp.startDate} — {exp.endDate || 'Present'}</p></div>
                          <p className="text-xs text-gray-500 mb-1">{exp.company || 'Company'}</p>
                          <ul className="space-y-0.5">{exp.bullets.filter(Boolean).map((b,bi) => <li key={bi} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-400 shrink-0">•</span>{b}</li>)}</ul>
                        </div>
                      ))}</>
                    )}
                    {sec.type === 'education' && resume.education.length > 0 && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education</h3>
                      {resume.education.map((edu,i) => <div key={i} className="mb-1.5"><p className="text-sm font-semibold text-gray-900">{edu.institution}</p><p className="text-xs text-gray-500">{edu.degree}{edu.field ? ` in ${edu.field}` : ''} {edu.startDate && `(${edu.startDate} - ${edu.endDate})`}</p></div>)}</>
                    )}
                    {sec.type === 'certifications' && resume.certifications.length > 0 && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Certifications</h3>
                      <ul className="space-y-0.5">{resume.certifications.map((c,i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><Award className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />{c}</li>)}</ul></>
                    )}
                    {sec.type === 'projects' && resume.projects.length > 0 && (
                      <><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projects</h3>
                      {resume.projects.map((p,i) => <div key={i} className="mb-2"><p className="text-sm font-semibold text-gray-900">{p.title}</p><p className="text-xs text-gray-500 mb-0.5">{p.description}</p>{p.techStack.length>0 && <div className="flex flex-wrap gap-1">{p.techStack.map((t,ti) => <span key={ti} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>}</div>)}</>
                    )}
                    {sec.type === 'custom' && resume.customSections.filter(cs => cs.title === sec.title).map((cs,ci) => (
                      cs.content ? <div key={ci}><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cs.title}</h3><p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{cs.content}</p></div> : null
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
