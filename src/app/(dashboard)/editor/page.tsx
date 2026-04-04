'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Save, Plus, Trash2, Briefcase, GraduationCap, User, FileText,
  ArrowLeft, Loader2, AlertTriangle, Download, ChevronUp, ChevronDown,
  Phone, Mail, MapPin, Award, FolderKanban, Search, PenLine, Lightbulb, Zap,
  Github, Linkedin, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { clientSideScore, type ClientScore } from '@/lib/editor/client-scorer';
import { cn } from '@/lib/cn';

interface Section { id: string; type: string; title: string; visible: boolean }
interface ExperienceItem { company: string; title: string; startDate: string; endDate: string; bullets: string[] }
interface EducationItem { institution: string; degree: string; field: string; startDate: string; endDate: string }
interface ProjectItem { title: string; description: string; techStack: string[]; link: string }
interface ResumeData {
  name: string; headline: string; email: string; phone: string; city: string;
  github: string; linkedin: string;
  summary: string; skills: string[];
  experience: ExperienceItem[]; education: EducationItem[]; certifications: string[];
  projects: ProjectItem[]; customSections: Array<{ title: string; content: string }>;
}
interface AISuggestion { type: string; message: string; impact: string }
interface AIScore { ats_score: number; breakdown: Record<string, number>; suggestions: AISuggestion[] }

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

  const [showPreview, setShowPreview] = useState(false);

  // Live scoring state
  const [clientScore, setClientScore] = useState<ClientScore | null>(null);
  const [aiScore, setAIScore] = useState<AIScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    fetch('/api/user/profile').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.parsedResume) {
        const pr = data.parsedResume as Record<string, unknown>;
        setResume({
          name: (pr.name as string) || '', headline: (pr.headline as string) || '',
          email: (pr.email as string) || '', phone: (pr.phone as string) || '', city: (pr.city as string) || '',
          github: (pr.github as string) || '', linkedin: (pr.linkedin as string) || '',
          summary: (pr.summary as string) || '', skills: (pr.skills as string[]) || [],
          experience: ((pr.experience as Array<Record<string, unknown>>) || []).map(e => ({
            company: (e.company as string) || '', title: (e.title as string) || '',
            startDate: (e.startDate as string) || '', endDate: (e.endDate as string) || '',
            bullets: Array.isArray(e.bullets) ? e.bullets as string[] : [],
          })),
          education: ((pr.education as Array<Record<string, unknown>>) || []).map(e => ({
            institution: (e.institution as string) || '', degree: (e.degree as string) || '',
            field: (e.field as string) || '', startDate: (e.startDate as string) || '', endDate: (e.endDate as string) || '',
          })),
          certifications: (pr.certifications as string[]) || [],
          projects: ((pr.projects as Array<Record<string, unknown>>) || []).map(p => ({
            title: (p.title as string) || '', description: (p.description as string) || '',
            techStack: (p.techStack as string[]) || [], link: (p.link as string) || '',
          })),
          customSections: [],
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));

    try { const f = sessionStorage.getItem('ats-fixes'); if (f) { setAtsFixes(JSON.parse(f)); sessionStorage.removeItem('ats-fixes'); } } catch {}
    fetch('/api/projects').then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setSavedProjects(d.map((p: Record<string, unknown>) => ({ title: (p.title as string) || '', description: (p.description as string) || '', techStack: (p.techStack as string[]) || [], link: (p.liveUrl as string) || '' })));
    }).catch(() => {});
  }, []);

  // Build resume text for scoring
  const formatResumeText = useCallback((): string => {
    if (!resume) return '';
    let t = `${resume.name}\n${resume.headline}\n`;
    if (resume.email || resume.phone || resume.city) t += `${[resume.email, resume.phone, resume.city].filter(Boolean).join(' | ')}\n`;
    if (resume.github || resume.linkedin) t += `${[resume.github, resume.linkedin].filter(Boolean).join(' | ')}\n`;
    t += '\n';
    for (const sec of sections) {
      if (!sec.visible) continue;
      if (sec.type === 'summary' && resume.summary) t += `SUMMARY\n${resume.summary}\n\n`;
      if (sec.type === 'skills' && resume.skills.length) t += `SKILLS\n${resume.skills.join(', ')}\n\n`;
      if (sec.type === 'experience' && resume.experience.length) { t += 'EXPERIENCE\n'; resume.experience.forEach(exp => { t += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`; exp.bullets.filter(Boolean).forEach(b => { t += `• ${b}\n`; }); t += '\n'; }); }
      if (sec.type === 'education' && resume.education.length) { t += 'EDUCATION\n'; resume.education.forEach(edu => { t += `${edu.degree} in ${edu.field} — ${edu.institution}\n`; }); t += '\n'; }
      if (sec.type === 'certifications' && resume.certifications.length) { t += 'CERTIFICATIONS\n'; resume.certifications.forEach(c => { t += `• ${c}\n`; }); t += '\n'; }
      if (sec.type === 'projects' && resume.projects.length) { t += 'PROJECTS\n'; resume.projects.forEach(p => { t += `${p.title}: ${p.description} [${p.techStack.join(', ')}]\n`; }); t += '\n'; }
      if (sec.type === 'custom') { const cs = resume.customSections.find(c => c.title === sec.title); if (cs?.content) t += `${cs.title.toUpperCase()}\n${cs.content}\n\n`; }
    }
    return t;
  }, [resume, sections]);

  // Client-side scoring on every change
  useEffect(() => {
    const text = formatResumeText();
    if (text.length > 30) setClientScore(clientSideScore(text));
  }, [resume, sections, formatResumeText]);

  // Track changes and trigger AI scoring every 5 changes
  useEffect(() => {
    if (changeCount > 0 && changeCount % 5 === 0) {
      const text = formatResumeText();
      if (text.length < 100) return;
      setIsScoring(true);
      fetch('/api/editor/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text }),
      }).then(r => r.ok ? r.json() : null).then(d => { if (d) setAIScore(d); }).catch(() => {}).finally(() => setIsScoring(false));
    }
  }, [changeCount, formatResumeText]);

  const trackChange = () => setChangeCount(c => c + 1);

  const moveSection = (idx: number, dir: -1 | 1) => { const n = idx + dir; if (n < 0 || n >= sections.length) return; const a = [...sections]; [a[idx], a[n]] = [a[n], a[idx]]; setSections(a); };
  const addCustomSection = () => { const id = `custom-${Date.now()}`; setSections([...sections, { id, type: 'custom', title: 'New Section', visible: true }]); if (resume) setResume({ ...resume, customSections: [...resume.customSections, { title: 'New Section', content: '' }] }); };

  const handleSave = async () => {
    if (!resume) return; setSaving(true);
    try {
      const res = await fetch('/api/user/profile/resume', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: formatResumeText(), resumeFileName: 'edited-resume', parsedResumeData: resume, analyze: false }) });
      if (res.ok) toast.success('Resume saved!'); else toast.error('Failed to save');
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const handleAnalyze = async () => {
    if (!resume) return; setAnalyzing(true);
    try {
      await fetch('/api/user/profile/resume', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: formatResumeText(), resumeFileName: 'edited-resume', parsedResumeData: resume, analyze: true }) });
      toast.success('Resume saved & analyzing!'); router.push('/analyze/resume-check');
    } catch { toast.error('Failed'); } finally { setAnalyzing(false); }
  };

  const handleDownload = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const text = formatResumeText();
    const lines = doc.splitTextToSize(text, 500);
    let y = 50; doc.setFontSize(11);
    for (const line of lines) { if (y > 780) { doc.addPage(); y = 50; } doc.text(line, 50, y); y += 16; }
    doc.save(`${resume?.name || 'resume'}.pdf`); toast.success('PDF downloaded');
  };

  if (loading) return <div className="max-w-7xl mx-auto p-6"><Skeleton className="h-[600px]" /></div>;
  if (!resume) return <PageTransition><div className="max-w-md mx-auto text-center py-20"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h2 className="text-lg font-semibold mb-2">No Resume Found</h2><Link href="/onboarding"><Button>Go to Onboarding</Button></Link></div></PageTransition>;

  const score = aiScore?.ats_score ?? clientScore?.atsEstimate ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-blue-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const barColor = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-blue-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const breakdown = aiScore?.breakdown ?? (clientScore ? { keyword_match: clientScore.breakdown.keywords ?? 0, formatting: clientScore.breakdown.formatting, action_verbs: clientScore.breakdown.actionVerbs, quantification: clientScore.breakdown.metrics, section_structure: clientScore.breakdown.structure } : null);

  // Unresolved ATS fixes
  const unresolvedFixes = atsFixes.filter(fix => {
    const l = fix.toLowerCase();
    if (l.includes('certification') && resume.certifications.length > 0) return false;
    if (l.includes('skill') && resume.skills.length >= 3) return false;
    if (l.includes('summary') && resume.summary.length > 20) return false;
    if (l.includes('project') && resume.projects.length > 0) return false;
    return true;
  });

  const updateResume = (updater: (r: ResumeData) => ResumeData) => { setResume(updater(resume)); trackChange(); };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div><h1 className="text-xl font-bold text-gray-900">Resume Editor</h1><p className="text-xs text-gray-500">Live ATS scoring as you edit</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5 hidden lg:flex">
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showPreview ? 'Hide' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5"><Download className="w-3.5 h-3.5" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save</Button>
            <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="bg-brand-600 hover:bg-brand-500 text-white gap-1.5">{analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Analyze</Button>
          </div>
        </div>

        <div className={cn('grid grid-cols-1 gap-4', showPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-3')}>
          {/* LEFT: Structured Editor */}
          <div className={cn('space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 scrollbar-thin', showPreview ? 'lg:col-span-5' : 'lg:col-span-2')}>
            {/* ATS Fixes */}
            {atsFixes.length > 0 && (
              <Card className={unresolvedFixes.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}>
                <CardHeader className="pb-2"><CardTitle className={cn('text-sm flex items-center gap-2', unresolvedFixes.length > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                  {unresolvedFixes.length > 0 ? <><AlertTriangle className="w-4 h-4" /> {unresolvedFixes.length} issues remaining</> : <span>All issues fixed!</span>}
                </CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {atsFixes.map((fix, i) => { const resolved = !unresolvedFixes.includes(fix); return (
                    <div key={i} className={cn('flex items-start gap-2 text-xs rounded-lg p-2', resolved ? 'bg-emerald-50 text-emerald-600 line-through opacity-60' : 'bg-amber-50 text-amber-800')}>
                      <span className={resolved ? 'text-emerald-500' : 'text-amber-500'}>{resolved ? '✓' : '!'}</span>{fix}
                    </div>
                  ); })}
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input value={resume.name} onChange={e => updateResume(r => ({...r, name: e.target.value}))} placeholder="Full Name" />
                <Input value={resume.headline} onChange={e => updateResume(r => ({...r, headline: e.target.value}))} placeholder="Headline" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative"><Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.email} onChange={e => updateResume(r => ({...r, email: e.target.value}))} placeholder="Email" className="pl-8 text-xs" /></div>
                  <div className="relative"><Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.phone} onChange={e => updateResume(r => ({...r, phone: e.target.value}))} placeholder="Phone" className="pl-8 text-xs" /></div>
                  <div className="relative"><MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.city} onChange={e => updateResume(r => ({...r, city: e.target.value}))} placeholder="City" className="pl-8 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative"><Github className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.github} onChange={e => updateResume(r => ({...r, github: e.target.value}))} placeholder="GitHub URL" className="pl-8 text-xs" /></div>
                  <div className="relative"><Linkedin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><Input value={resume.linkedin} onChange={e => updateResume(r => ({...r, linkedin: e.target.value}))} placeholder="LinkedIn URL" className="pl-8 text-xs" /></div>
                </div>
              </CardContent></Card>

            {/* Summary */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
              <CardContent><Textarea value={resume.summary} onChange={e => updateResume(r => ({...r, summary: e.target.value}))} rows={3} className="resize-none text-sm" placeholder="Professional summary..." /></CardContent></Card>

            {/* Skills */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-2">{resume.skills.map((s,i) => <Badge key={i} variant="purple" className="gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600" onClick={() => { updateResume(r => ({...r, skills: r.skills.filter((_,j)=>j!==i)})); }}>{s} <Trash2 className="w-2.5 h-2.5" /></Badge>)}</div>
                <div className="flex gap-2"><Input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && newSkill.trim()) { updateResume(r => ({...r, skills: [...r.skills, newSkill.trim()]})); setNewSkill(''); }}} placeholder="Add skill..." className="text-sm" /><Button variant="outline" size="sm" onClick={() => { if (newSkill.trim()) { updateResume(r => ({...r, skills: [...r.skills, newSkill.trim()]})); setNewSkill(''); }}}>Add</Button></div>
              </CardContent></Card>

            {/* Experience */}
            <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Experience</CardTitle><Button variant="ghost" size="sm" onClick={() => updateResume(r => ({...r, experience: [...r.experience, {company:'',title:'',startDate:'',endDate:'',bullets:['']}]}))} className="text-xs gap-1"><Plus className="w-3 h-3" /> Add</Button></div></CardHeader>
              <CardContent className="space-y-3">
                {resume.experience.map((exp, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group">
                    <button onClick={() => updateResume(r => ({...r, experience: r.experience.filter((_,j)=>j!==i)}))} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={exp.title} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],title:e.target.value}; updateResume(r => ({...r,experience:x})); }} placeholder="Job Title" className="text-sm" />
                      <Input value={exp.company} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],company:e.target.value}; updateResume(r => ({...r,experience:x})); }} placeholder="Company" className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="month" value={exp.startDate} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],startDate:e.target.value}; updateResume(r => ({...r,experience:x})); }} className="text-xs" />
                      <Input type="month" value={exp.endDate} onChange={e => { const x=[...resume.experience]; x[i]={...x[i],endDate:e.target.value}; updateResume(r => ({...r,experience:x})); }} placeholder="Present" className="text-xs" />
                    </div>
                    {exp.bullets.map((b,bi) => (
                      <div key={bi} className="flex gap-1.5 items-start"><span className="text-gray-300 mt-2.5 text-xs">•</span>
                        <Input value={b} onChange={e => { const x=[...resume.experience]; const bl=[...x[i].bullets]; bl[bi]=e.target.value; x[i]={...x[i],bullets:bl}; updateResume(r => ({...r,experience:x})); }} className="text-xs flex-1" />
                        <button onClick={() => { const x=[...resume.experience]; x[i]={...x[i],bullets:x[i].bullets.filter((_,j)=>j!==bi)}; updateResume(r => ({...r,experience:x})); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <button onClick={() => { const x=[...resume.experience]; x[i]={...x[i],bullets:[...x[i].bullets,'']}; updateResume(r => ({...r,experience:x})); }} className="text-xs text-brand-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add bullet</button>
                  </div>
                ))}
              </CardContent></Card>

            {/* Education */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Education</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {resume.education.map((edu,i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group">
                    <button onClick={() => updateResume(r => ({...r, education: r.education.filter((_,j)=>j!==i)}))} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    <Input value={edu.institution} onChange={e => { const x=[...resume.education]; x[i]={...x[i],institution:e.target.value}; updateResume(r => ({...r,education:x})); }} placeholder="Institution" className="text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={edu.degree} onChange={e => { const x=[...resume.education]; x[i]={...x[i],degree:e.target.value}; updateResume(r => ({...r,education:x})); }} placeholder="Degree" className="text-xs" />
                      <Input value={edu.field} onChange={e => { const x=[...resume.education]; x[i]={...x[i],field:e.target.value}; updateResume(r => ({...r,education:x})); }} placeholder="Field" className="text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent></Card>

            {/* Certifications */}
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Certifications</CardTitle></CardHeader>
              <CardContent>
                {resume.certifications.map((c,i) => (
                  <div key={i} className="flex gap-2 items-center mb-1.5"><Award className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Input value={c} onChange={e => { const x=[...resume.certifications]; x[i]=e.target.value; updateResume(r => ({...r,certifications:x})); }} className="text-xs flex-1" />
                    <button onClick={() => updateResume(r => ({...r, certifications: r.certifications.filter((_,j)=>j!==i)}))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2"><Input value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && newCert.trim()) { updateResume(r => ({...r, certifications: [...r.certifications, newCert.trim()]})); setNewCert(''); }}} placeholder="Add certification..." className="text-xs" /><Button variant="outline" size="sm" onClick={() => { if (newCert.trim()) { updateResume(r => ({...r, certifications: [...r.certifications, newCert.trim()]})); setNewCert(''); }}}>Add</Button></div>
              </CardContent></Card>

            {/* Projects */}
            <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Projects</CardTitle><Button variant="ghost" size="sm" onClick={() => updateResume(r => ({...r, projects: [...r.projects, {title:'',description:'',techStack:[],link:''}]}))} className="text-xs gap-1"><Plus className="w-3 h-3" /> Add</Button></div></CardHeader>
              <CardContent className="space-y-3">
                {resume.projects.map((p,i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group">
                    <button onClick={() => updateResume(r => ({...r, projects: r.projects.filter((_,j)=>j!==i)}))} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    <Input value={p.title} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],title:e.target.value}; updateResume(r => ({...r,projects:x})); }} placeholder="Project Title" className="text-sm" />
                    <Textarea value={p.description} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],description:e.target.value}; updateResume(r => ({...r,projects:x})); }} placeholder="Description" rows={2} className="text-xs resize-none" />
                    <Input value={p.techStack.join(', ')} onChange={e => { const x=[...resume.projects]; x[i]={...x[i],techStack:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}; updateResume(r => ({...r,projects:x})); }} placeholder="Tech stack (comma separated)" className="text-xs" />
                  </div>
                ))}
                {savedProjects.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Add from saved</p>
                    {savedProjects.slice(0,3).map((sp,i) => (
                      <button key={i} onClick={() => { if (!resume.projects.some(p => p.title === sp.title)) { updateResume(r => ({...r, projects: [...r.projects, sp]})); toast.success(`Added "${sp.title}"`); } else toast.error('Already added'); }}
                        className="flex items-center gap-2 w-full text-left text-xs p-2 rounded-lg hover:bg-gray-50 transition">
                        <FolderKanban className="w-3 h-3 text-gray-400" /><span className="text-gray-700 truncate">{sp.title}</span><Plus className="w-3 h-3 text-brand-500 ml-auto" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent></Card>

            <Button variant="outline" onClick={addCustomSection} className="w-full gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add Custom Section</Button>
          </div>

          {/* CENTER: Live Resume Preview (toggleable) */}
          {showPreview && (
            <div className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-4 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin">
                <div className="p-8">
                  {/* Name & headline */}
                  <div className="text-center mb-5 pb-4 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">{resume.name || 'Your Name'}</h2>
                    <p className="text-sm text-gray-500 mt-1">{resume.headline || 'Professional Title'}</p>
                    {(resume.email || resume.phone || resume.city) && (
                      <p className="text-xs text-gray-400 mt-1.5">{[resume.email, resume.phone, resume.city].filter(Boolean).join(' | ')}</p>
                    )}
                    {(resume.github || resume.linkedin) && (
                      <p className="text-xs text-gray-400 mt-0.5">{[resume.github, resume.linkedin].filter(Boolean).join(' | ')}</p>
                    )}
                  </div>

                  {/* Summary */}
                  {resume.summary && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Summary</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Skills</h3>
                      <div className="flex flex-wrap gap-1.5">{resume.skills.map((s, i) => <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s}</span>)}</div>
                    </div>
                  )}

                  {/* Experience */}
                  {resume.experience.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</h3>
                      {resume.experience.map((exp, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex items-baseline justify-between">
                            <p className="text-sm font-semibold text-gray-900">{exp.title || 'Title'}</p>
                            <p className="text-[10px] text-gray-400">{exp.startDate} — {exp.endDate || 'Present'}</p>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{exp.company || 'Company'}</p>
                          <ul className="space-y-0.5">{exp.bullets.filter(Boolean).map((b, bi) => <li key={bi} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-400 shrink-0">•</span>{b}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {resume.education.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education</h3>
                      {resume.education.map((edu, i) => (
                        <div key={i} className="mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">{edu.institution}</p>
                          <p className="text-xs text-gray-500">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {resume.certifications.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Certifications</h3>
                      <ul className="space-y-0.5">{resume.certifications.map((c, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><Award className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />{c}</li>)}</ul>
                    </div>
                  )}

                  {/* Projects */}
                  {resume.projects.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projects</h3>
                      {resume.projects.map((p, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-500 mb-0.5">{p.description}</p>
                          {p.techStack.length > 0 && <div className="flex flex-wrap gap-1">{p.techStack.map((t, ti) => <span key={ti} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Live ATS Score Panel */}
          <div className={cn('space-y-3 lg:sticky lg:top-4 lg:self-start', showPreview ? 'lg:col-span-3' : '')}>
            {/* ATS Score */}
            <Card>
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Live ATS Score</p>
                  {isScoring && <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <motion.p key={score} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={cn('text-5xl font-bold tabular-nums', scoreColor)}>{score}</motion.p>
                <p className="text-xs text-gray-400 mt-1">{score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Keep editing'} · {clientScore?.wordCount ?? 0} words</p>
                <p className="text-[10px] text-gray-300 mt-2">AI re-scores every 5 edits · Change #{changeCount}</p>
              </CardContent>
            </Card>

            {/* Breakdown */}
            {breakdown && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(breakdown).map(([key, val]) => {
                    const v = typeof val === 'number' ? val : 0;
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-700">{v}</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <motion.div animate={{ width: `${v}%` }} transition={{ duration: 0.5 }} className={cn('h-1.5 rounded-full', barColor(v))} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {aiScore?.suggestions && aiScore.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> AI Suggestions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {aiScore.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-gray-50">
                      <Zap className="w-3 h-3 text-brand-500 shrink-0 mt-0.5" />
                      <div><p className="text-gray-700">{s.message}</p><p className="text-brand-600 font-medium mt-0.5">{s.impact}</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weak Verbs */}
            {clientScore && clientScore.weakVerbs.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Weak Verbs</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">{clientScore.weakVerbs.map(v => <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">{v}</span>)}</div>
                  <p className="text-[10px] text-gray-400 mt-2">Replace with stronger action verbs</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
