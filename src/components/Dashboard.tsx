import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  Briefcase,
  Folder,
  Video,
  LifeBuoy,
  FileJson,
  Plus,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  GraduationCap,
  X,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  Activity,
  UserPlus,
  Code2,
  LogOut,
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import StudentDashboard, { LoggedInStudent } from './StudentDashboard';
import AdminNavbar from './AdminNavbar';
import AdminSidebar, { type AdminSection } from './AdminSidebar';
import AdminTicketDesk from './AdminTicketDesk';
import NotificationCenter from './NotificationCenter';

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  gpa: number | string;
  status: string;
  batch: string;
  attendance: string;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  deadline: string;
  submitted: number;
  total: number;
  status: string;
  priority: string;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  stipend: string;
  applicants: number;
  status: string;
  logo: string;
}

export interface Project {
  id: string;
  title: string;
  lead: string;
  tech: string[];
  progress: number;
  status: string;
  category: string;
}

export interface ClassItem {
  id: string;
  title: string;
  code: string;
  instructor: string;
  time: string;
  room: string;
  status: string;
  students: number;
}

export interface Ticket {
  id: string;
  subject: string;
  user: string;
  category: string;
  priority: string;
  status: string;
  time: string;
}

const initialStudents: Student[] = [
  { id: 'STU-101', name: 'Sophia Chen', email: 'sophia.c@edu.io', department: 'Computer Science', gpa: 3.92, status: 'Active', batch: '2025', attendance: '96%' },
  { id: 'STU-102', name: 'Marcus Vance', email: 'm.vance@edu.io', department: 'Data Science', gpa: 3.85, status: 'Active', batch: '2025', attendance: '92%' },
  { id: 'STU-103', name: 'Elena Rostova', email: 'elena.r@edu.io', department: 'Software Eng', gpa: 3.78, status: 'On Leave', batch: '2026', attendance: '88%' },
  { id: 'STU-104', name: 'Aarav Patel', email: 'a.patel@edu.io', department: 'AI & Robotics', gpa: 3.98, status: 'Active', batch: '2024', attendance: '99%' },
  { id: 'STU-105', name: 'Liam O\'Connor', email: 'liam.oc@edu.io', department: 'Cybersecurity', gpa: 3.65, status: 'Active', batch: '2025', attendance: '91%' },
  { id: 'STU-106', name: 'Maya Lin', email: 'maya.lin@edu.io', department: 'UX / Product Design', gpa: 3.90, status: 'Active', batch: '2026', attendance: '95%' }
];

const initialAssignments: Assignment[] = [
  { id: 'ASN-301', title: 'Distributed Systems Raft Consensus Engine', course: 'CS-401', deadline: '2026-08-28', submitted: 42, total: 48, status: 'Grading In Progress', priority: 'High' },
  { id: 'ASN-302', title: 'Deep Neural Net Transformer Architecture', course: 'AI-502', deadline: '2026-08-30', submitted: 35, total: 50, status: 'Active', priority: 'Urgent' },
  { id: 'ASN-303', title: 'Microservices Design Patterns Case Study', course: 'SE-302', deadline: '2026-09-02', submitted: 18, total: 45, status: 'Active', priority: 'Medium' },
  { id: 'ASN-304', title: 'Interactive Dashboard with TanStack & Framer', course: 'FED-204', deadline: '2026-08-25', submitted: 45, total: 45, status: 'Completed', priority: 'Low' }
];

const initialInternships: Internship[] = [
  { id: 'INT-801', company: 'Google Quantum AI', role: 'Full Stack Engineer Intern', location: 'Mountain View / Hybrid', stipend: '$9,200/mo', applicants: 124, status: 'Interviews Live', logo: '🌐' },
  { id: 'INT-802', company: 'OpenAI Labs', role: 'AI Research Assistant', location: 'San Francisco, CA', stipend: '$10,500/mo', applicants: 210, status: 'Screening', logo: '⚡' },
  { id: 'INT-803', company: 'Stripe Global', role: 'Infrastructure Security Intern', location: 'Remote', stipend: '$8,800/mo', applicants: 98, status: 'Selected (14)', logo: '💳' },
  { id: 'INT-804', company: 'Tesla Autopilot Team', role: 'Computer Vision Engineer', location: 'Palo Alto, CA', stipend: '$9,000/mo', applicants: 156, status: 'Closed', logo: '🚗' }
];

const initialProjects: Project[] = [
  { id: 'PRJ-501', title: 'Autonomous Drone Navigation System', lead: 'Aarav Patel', tech: ['Python', 'ROS', 'OpenCV'], progress: 85, status: 'Final Review', category: 'Robotics' },
  { id: 'PRJ-502', title: 'Decentralized Healthcare Record Vault', lead: 'Sophia Chen', tech: ['Solidity', 'React', 'IPFS'], progress: 62, status: 'Development', category: 'Web3' },
  { id: 'PRJ-503', title: 'Realtime Voice Translation Engine', lead: 'Marcus Vance', tech: ['PyTorch', 'Rust', 'WebAssembly'], progress: 94, status: 'Testing', category: 'AI/ML' },
  { id: 'PRJ-504', title: 'Cloud Native Kubernetes Observability', lead: 'Liam O\'Connor', tech: ['Go', 'Prometheus', 'Grafana'], progress: 40, status: 'Development', category: 'DevOps' }
];

const initialClasses: ClassItem[] = [
  { id: 'CLS-01', title: 'Advanced Algorithms & Complexity', code: 'CS-401', instructor: 'Dr. Alan Turing', time: '10:00 AM - 11:30 AM', room: 'Hall 302', status: 'Live Now', students: 48 },
  { id: 'CLS-02', title: 'Neural Networks & Deep Learning', code: 'AI-502', instructor: 'Dr. Fei-Fei Li', time: '01:00 PM - 02:30 PM', room: 'Lab B-12', status: 'Upcoming', students: 50 },
  { id: 'CLS-03', title: 'Modern Frontend Architecture', code: 'FED-204', instructor: 'Prof. Sarah Connor', time: '03:00 PM - 04:30 PM', room: 'Online Auditorium', status: 'Upcoming', students: 45 },
  { id: 'CLS-04', title: 'Cybersecurity & Ethical Hacking', code: 'SEC-301', instructor: 'Dr. Elliot Alderson', time: '05:00 PM - 06:30 PM', room: 'Cyber Lab 04', status: 'Completed', students: 42 }
];

const initialTickets: Ticket[] = [
  { id: 'TCK-901', subject: 'GPU Cluster Memory Allocation Error', user: 'Marcus Vance', category: 'Tech Support', priority: 'Urgent', status: 'Open', time: '12 mins ago' },
  { id: 'TCK-902', subject: 'Request for Internship Sponsor Letter', user: 'Sophia Chen', category: 'Administration', priority: 'High', status: 'In Progress', time: '1 hour ago' },
  { id: 'TCK-903', subject: 'Lab Access Card Resync Issue', user: 'Liam O\'Connor', category: 'Facility', priority: 'Medium', status: 'Open', time: '3 hours ago' },
  { id: 'TCK-904', subject: 'Assignment ASN-301 Resubmission Extension', user: 'Elena Rostova', category: 'Academic', priority: 'Low', status: 'Resolved', time: '1 day ago' }
];

const chartData = [
  { month: 'Jan', attendance: 92, assignments: 38, placements: 12, tickets: 45 },
  { month: 'Feb', attendance: 94, assignments: 42, placements: 18, tickets: 38 },
  { month: 'Mar', attendance: 91, assignments: 45, placements: 28, tickets: 30 },
  { month: 'Apr', attendance: 96, assignments: 48, placements: 45, tickets: 22 },
  { month: 'May', attendance: 95, assignments: 52, placements: 68, tickets: 19 },
  { month: 'Jun', attendance: 98, assignments: 60, placements: 85, tickets: 14 }
];

const categoryPieData = [
  { name: 'Computer Science', value: 40, color: '#ed143d' },
  { name: 'AI & Robotics', value: 25, color: '#f43f5e' },
  { name: 'Data Science', value: 20, color: '#fb7185' },
  { name: 'Cybersecurity', value: 15, color: '#fda4af' }
];

interface ModernCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  subtitle: string;
  highlightColor?: string;
  onClick?: () => void;
}

const ModernCard: React.FC<ModernCardProps> = ({ title, value, change, icon: Icon, subtitle, highlightColor = '#ed143d', onClick }) => {
  return (
    <div
      onClick={onClick}
      className="kpi-card group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
    >
      <div 
        className="kpi-glow pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: highlightColor }}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
        <div className="kpi-icon rounded-xl bg-slate-800/80 p-3 text-[#ed143d]">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-3 mb-2">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {change && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            {change}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 flex items-center justify-between">
        <span>{subtitle}</span>
        <ArrowUpRight className="kpi-arrow h-4 w-4 text-slate-500" />
      </p>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<string>('dark');
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const requestedTab = sessionStorage.getItem('admin-active-tab');
    const validTabs = ['dashboard', 'assignments', 'classes', 'internships', 'projects', 'tickets'];
    return requestedTab && validTabs.includes(requestedTab) ? requestedTab : 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [internships] = useState<Internship[]>(initialInternships);
  const [projects] = useState<Project[]>(initialProjects);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [currentStudent, setCurrentStudent] = useState<LoggedInStudent | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('university-theme') || 'dark';
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;

      const savedStudent = localStorage.getItem('current-student');
      if (savedStudent) {
        try {
          setCurrentStudent(JSON.parse(savedStudent));
        } catch {
          // invalid
        }
      }
    }
  }, []);

  const handleSignOutStudent = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current-student');
    }
    setCurrentStudent(null);
    navigate({ to: '/login' });
  };

  if (currentStudent) {
    return <StudentDashboard student={currentStudent} onSignOut={handleSignOutStudent} />;
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('university-theme', nextTheme);
    }
  };

  const chartTheme = theme === 'light'
    ? { grid: '#e2e8f0', axis: '#64748b', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a' }
    : { grid: '#1e293b', axis: '#64748b', surface: '#0f172a', border: '#334155', text: '#ffffff' };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const q = searchQuery.toLowerCase();
  const filteredAssignments = q
    ? assignments.filter(a => a.title.toLowerCase().includes(q) || a.course.toLowerCase().includes(q))
    : assignments;
  const filteredInternships = q
    ? internships.filter(i => i.company.toLowerCase().includes(q) || i.role.toLowerCase().includes(q))
    : internships;
  const filteredProjects = q
    ? projects.filter(p => p.title.toLowerCase().includes(q) || p.lead.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    : projects;
  const filteredClasses = q
    ? classes.filter(c => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    : classes;
  const filteredTickets = q
    ? tickets.filter(t => t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    : tickets;

  const navGroups = [
    {
      label: 'Overview',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null }],
    },
    {
      label: 'Academics',
      items: [
        { id: 'students', label: 'Students', icon: Users, badge: null },
        { id: 'import', label: 'Import JSON', icon: FileJson, badge: null },
        { id: 'assignments', label: 'Assignments', icon: BookOpen, badge: assignments.length },
        { id: 'classes', label: 'Classes', icon: Video, badge: null },
      ],
    },
    {
      label: 'Career & Research',
      items: [
        { id: 'internships', label: 'Internships', icon: Briefcase, badge: internships.length },
        { id: 'projects', label: 'Projects', icon: Folder, badge: projects.length },
      ],
    },
    {
      label: 'Support',
      items: [
        { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy, badge: tickets.filter(t => t.status === 'Open').length },
      ],
    },
  ];

  const handleResolveTicket = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    showToast(`Ticket ${id} marked as resolved!`);
  };

  const handleToggleClass = (id: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Live Now' ? 'Completed' : 'Live Now' } : c));
    showToast(`Class status updated!`);
  };

  const handleAdminNavigation = (id: AdminSection) => {
    setMobileNavOpen(false);
    if (id === 'students') navigate({ to: '/students' });
    else if (id === 'import') navigate({ to: '/import' });
    else {
      sessionStorage.setItem('admin-active-tab', id);
      setActiveTab(id);
    }
  };

  const handleAdminSignOut = () => {
    localStorage.removeItem('staff-session');
    localStorage.removeItem('current-student');
    localStorage.removeItem('admin-key');
    navigate({ to: '/login' });
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (modalType === 'student') {
      const newStu: Student = {
        id: `STU-${100 + students.length + 1}`,
        name: (formData.get('name') as string) || 'New Student',
        email: (formData.get('email') as string) || 'student@edu.io',
        department: (formData.get('department') as string) || 'Computer Science',
        gpa: (formData.get('gpa') as string) || '3.80',
        status: 'Active',
        batch: '2026',
        attendance: '100%'
      };
      setStudents([newStu, ...students]);
      showToast(`Student ${newStu.name} added successfully!`);
    } else if (modalType === 'ticket') {
      const newTck: Ticket = {
        id: `TCK-${900 + tickets.length + 1}`,
        subject: (formData.get('subject') as string) || 'Support Request',
        user: (formData.get('user') as string) || 'Current User',
        category: (formData.get('category') as string) || 'Tech Support',
        priority: (formData.get('priority') as string) || 'Medium',
        status: 'Open',
        time: 'Just now'
      };
      setTickets([newTck, ...tickets]);
      showToast(`Ticket submitted successfully!`);
    } else if (modalType === 'assignment') {
      const newAsn: Assignment = {
        id: `ASN-${300 + assignments.length + 1}`,
        title: (formData.get('title') as string) || 'New Assignment',
        course: (formData.get('course') as string) || 'CS-401',
        deadline: (formData.get('deadline') as string) || '2026-09-10',
        submitted: 0,
        total: 50,
        status: 'Active',
        priority: (formData.get('priority') as string) || 'Medium'
      };
      setAssignments([newAsn, ...assignments]);
      showToast(`Assignment ${newAsn.title} created!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-[#ed143d] selection:text-white antialiased">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 right-5 z-50 flex items-center space-x-3 bg-[#ed143d] text-white px-5 py-3 rounded-xl shadow-2xl shadow-[#ed143d]/40 font-medium"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-full">

        <AdminSidebar
          activeItem={activeTab as AdminSection}
          mobileOpen={mobileNavOpen}
          onNavigate={handleAdminNavigation}
          onClose={() => setMobileNavOpen(false)}
          onSignOut={handleAdminSignOut}
          badges={{
            assignments: assignments.length,
            internships: internships.length,
            projects: projects.length,
            tickets: tickets.filter(ticket => ticket.status === 'Open').length,
          }}
        />

        {false && <>{mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between backdrop-blur-2xl overflow-y-auto transition-transform duration-300 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div>
            <div className="p-6 flex items-center space-x-3 border-b border-slate-800/80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ed143d] to-rose-500 flex items-center justify-center shadow-lg shadow-[#ed143d]/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-[14px] text-white tracking-wide flex items-center">
                  BTU <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-[#ed143d]/20 text-[#ed143d] border border-[#ed143d]/30 font-mono">Campus OS</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Bir Tikendrajit University</p>
              </div>
            </div>

            <nav className="p-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setMobileNavOpen(false);
                            if (item.id === 'import') {
                              navigate({ to: '/import' })
                            } else if (item.id === 'students') {
                              navigate({ to: '/students' })
                            } else {
                              sessionStorage.setItem('admin-active-tab', item.id)
                              setActiveTab(item.id)
                            }
                          }}
                          className={`sidebar-nav-item relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                            isActive
                              ? 'text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTabBg"
                              className="absolute inset-0 bg-gradient-to-r from-[#ed143d] to-rose-600 rounded-xl shadow-lg shadow-[#ed143d]/30"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}

                          <div className="relative z-10 flex items-center space-x-3">
                            <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className="sidebar-nav-label">{item.label}</span>
                          </div>

                          {item.badge !== null && (
                            <span className={`relative z-10 text-xs px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-[#ed143d] flex items-center justify-center font-bold text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">BTU Admin</p>
                <p className="text-xs text-slate-400">Staff Portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('staff-session');
                  localStorage.removeItem('current-student');
                  localStorage.removeItem('admin-key');
                }
                navigate({ to: '/login' });
              }}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#ed143d]/10 hover:text-[#ed143d]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside></>}

        <main className="h-screen overflow-y-auto bg-slate-950 lg:ml-[260px]">
          
          <AdminNavbar
            theme={theme}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleNavigation={() => setMobileNavOpen(prev => !prev)}
            onToggleTheme={toggleTheme}
            onNewTicket={() => { setModalType('ticket'); setIsModalOpen(true) }}
            notificationControl={<NotificationCenter recipientType="ADMIN" />}
          />

          <div className="p-6 md:p-8 space-y-8 w-full">

            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-5 py-2 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                      Welcome back, Academic Portal <span aria-hidden="true">👋</span>
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
                      A clear view of today’s students, coursework, placements, and campus activity.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => {
                        setModalType('student');
                        setIsModalOpen(true);
                      }}
                      className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-[#ed143d]/50 hover:text-[#ed143d]"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Student</span>
                    </button>
                    <button 
                      onClick={() => {
                        setModalType('assignment');
                        setIsModalOpen(true);
                      }}
                      className="flex items-center space-x-2 rounded-xl bg-[#ed143d] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ed143d]/20 transition-[background-color,transform] hover:bg-rose-700 active:translate-y-px"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Assignment</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <ModernCard
                    title="TOTAL STUDENTS"
                    value={students.length.toLocaleString()}
                    change="+12.4%"
                    icon={Users}
                    subtitle="98% Active Enrolled"
                    onClick={() => navigate({ to: '/students' })}
                  />
                  <ModernCard
                    title="ACTIVE ASSIGNMENTS"
                    value={assignments.filter(a => a.status === 'Active').length}
                    change="4 Due Today"
                    icon={BookOpen}
                    subtitle="88% Average Submission"
                    onClick={() => setActiveTab('assignments')}
                  />
                  <ModernCard
                    title="INTERNSHIP PLACEMENTS"
                    value={internships.length}
                    change="94% Success Rate"
                    icon={Briefcase}
                    subtitle="Avg Stipend $9.3k/mo"
                    onClick={() => setActiveTab('internships')}
                  />
                  <ModernCard
                    title="CAPSTONE PROJECTS"
                    value={projects.length}
                    change="8 Ready for Demo"
                    icon={Folder}
                    subtitle="34 Ongoing Repos"
                    onClick={() => setActiveTab('projects')}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-xl">
                    <div className="flex flex-col gap-3 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-[#ed143d]" />
                          <span>Campus Performance & Engagement</span>
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">Six-month academic health and engagement summary</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Sample data
                        </span>
                        <span className="rounded-full border border-[#ed143d]/30 bg-[#ed143d]/10 px-3 py-1 text-xs font-semibold text-[#ed143d]">
                          +6.5% growth
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-950/50 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            <th className="px-6 py-3.5">Period</th>
                            <th className="px-4 py-3.5">Attendance</th>
                            <th className="px-4 py-3.5">Assignments</th>
                            <th className="px-4 py-3.5">Placements</th>
                            <th className="px-4 py-3.5">Support load</th>
                            <th className="px-6 py-3.5 text-right">Health</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {chartData.map((row, index) => {
                            const previous = chartData[index - 1];
                            const attendanceChange = previous ? row.attendance - previous.attendance : 0;
                            const health = row.attendance >= 96 ? 'Excellent' : row.attendance >= 93 ? 'Strong' : 'Watch';
                            const healthClasses = health === 'Excellent'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : health === 'Strong'
                                ? 'border-[#ed143d]/30 bg-[#ed143d]/10 text-[#ed143d]'
                                : 'border-amber-500/20 bg-amber-500/10 text-amber-400';

                            return (
                              <tr key={row.month} className="group transition-colors hover:bg-slate-800/40">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-extrabold text-white transition-colors group-hover:bg-[#ed143d]">
                                      {row.month}
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold text-white">{row.month} 2026</p>
                                      <p className="text-[11px] text-slate-500">Monthly cycle</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                                      <div className="h-full rounded-full bg-[#ed143d]" style={{ width: `${row.attendance}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-white">{row.attendance}%</span>
                                    {previous && (
                                      <span className={`text-[10px] font-bold ${attendanceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {attendanceChange >= 0 ? '+' : ''}{attendanceChange}%
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    {row.assignments} submitted
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm font-bold text-white">{row.placements}</span>
                                  <span className="ml-1 text-xs text-slate-500">offers</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${row.tickets <= 20 ? 'bg-emerald-500/10 text-emerald-400' : row.tickets <= 35 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {row.tickets} tickets
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${healthClasses}`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {health}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-[#ed143d]" />
                        <span>Department Distribution</span>
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">Enrollment by major specialization</p>
                      
                      <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke={chartTheme.surface} strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: chartTheme.surface, borderColor: chartTheme.border, borderRadius: '12px', color: chartTheme.text }}
                              labelStyle={{ color: chartTheme.text }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      {categoryPieData.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            <span className="text-slate-300 font-medium">{cat.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <Video className="w-5 h-5 text-[#ed143d]" />
                        <span>Today's Live Classes</span>
                      </h3>
                      <button onClick={() => setActiveTab('classes')} className="text-xs text-[#ed143d] hover:underline flex items-center">
                        View All <ChevronRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {classes.slice(0, 3).map((cls) => (
                        <div key={cls.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-lg ${cls.status === 'Live Now' ? 'bg-[#ed143d]/20 text-[#ed143d] animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                              <Video className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{cls.title}</p>
                              <p className="text-xs text-slate-400">{cls.instructor} • {cls.time}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleToggleClass(cls.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              cls.status === 'Live Now' 
                                ? 'bg-[#ed143d] text-white shadow-md shadow-[#ed143d]/30' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {cls.status === 'Live Now' ? 'Join Stream' : cls.status}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <LifeBuoy className="w-5 h-5 text-[#ed143d]" />
                        <span>Urgent Support Tickets</span>
                      </h3>
                      <button onClick={() => setActiveTab('tickets')} className="text-xs text-[#ed143d] hover:underline flex items-center">
                        Desk <ChevronRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tickets.slice(0, 3).map((tck) => (
                        <div key={tck.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tck.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {tck.priority}
                              </span>
                              <p className="text-sm font-semibold text-white truncate max-w-xs">{tck.subject}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Requested by {tck.user} • {tck.time}</p>
                          </div>
                          {tck.status !== 'Resolved' ? (
                            <button
                              onClick={() => handleResolveTicket(tck.id)}
                              className="px-3 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition-all"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-400 flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolved
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === 'assignments' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Course Assignments</h2>
                    <p className="text-slate-400 text-sm">Track active submissions, grading timelines, and deadlines.</p>
                  </div>
                  <button 
                    onClick={() => { setModalType('assignment'); setIsModalOpen(true); }}
                    className="px-4 py-2.5 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#ed143d]/30 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assignment</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAssignments.map((asn) => {
                    const percentage = Math.round((asn.submitted / asn.total) * 100);
                    return (
                      <div key={asn.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#ed143d]/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-[#ed143d] border border-slate-700">
                              {asn.course}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#ed143d] transition-colors">{asn.title}</h3>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            asn.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {asn.priority}
                          </span>
                        </div>

                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between text-xs font-medium text-slate-400">
                            <span>Submissions ({asn.submitted}/{asn.total})</span>
                            <span className="text-white font-bold">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-[#ed143d] to-rose-500 h-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-[#ed143d]" />
                            Due {asn.deadline}
                          </span>
                          <span className="font-semibold text-slate-300">{asn.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'internships' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Internship & Recruitment Portal</h2>
                  <p className="text-slate-400 text-sm">Corporate partner opportunities and student placement status.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {filteredInternships.map((intern) => (
                    <div key={intern.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-[#ed143d]/40 transition-all">
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                            {intern.logo}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">{intern.company}</h3>
                            <p className="text-xs text-slate-400">{intern.location}</p>
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-2">{intern.role}</h4>
                        <div className="flex items-center space-x-3 text-xs mb-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                            {intern.stipend}
                          </span>
                          <span className="text-slate-400">{intern.applicants} Applicants</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-[#ed143d] font-semibold">{intern.status}</span>
                        <button className="px-3.5 py-1.5 bg-slate-800 hover:bg-[#ed143d] text-white rounded-xl text-xs font-semibold transition-all">
                          Apply / Refer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Capstone Projects Hub</h2>
                  <p className="text-slate-400 text-sm">Student research, open-source repositories, and tech stacks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProjects.map((proj) => (
                    <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ed143d]/20 text-[#ed143d]">
                            {proj.category}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-2">{proj.title}</h3>
                        </div>
                        <Code2 className="w-5 h-5 text-slate-500" />
                      </div>

                      <p className="text-xs text-slate-400">Team Lead: <span className="text-white font-medium">{proj.lead}</span></p>

                      <div className="flex flex-wrap gap-2">
                        {proj.tech.map((t, idx) => (
                          <span key={idx} className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Milestone Completion</span>
                          <span className="text-white font-bold">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#ed143d] h-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'classes' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Live Classes & Timetable</h2>
                  <p className="text-slate-400 text-sm">Interactive schedules and direct virtual classroom launchers.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredClasses.map((cls) => (
                    <div key={cls.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3.5 rounded-xl ${cls.status === 'Live Now' ? 'bg-[#ed143d] text-white shadow-lg shadow-[#ed143d]/40' : 'bg-slate-800 text-slate-400'}`}>
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-[#ed143d] font-bold">{cls.code}</span>
                            <span className="text-xs text-slate-500">• {cls.room}</span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-0.5">{cls.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">Instructor: {cls.instructor} | Enrolled: {cls.students} Students</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                        <span className="text-xs font-mono text-slate-300">{cls.time}</span>
                        <button
                          onClick={() => handleToggleClass(cls.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            cls.status === 'Live Now'
                              ? 'bg-[#ed143d] text-white shadow-lg shadow-[#ed143d]/30 animate-pulse'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {cls.status === 'Live Now' ? 'Enter Classroom' : cls.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {false && <>
            {activeTab === 'tickets' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1500px] space-y-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ed143d]"><LifeBuoy className="h-4 w-4" />Support Center</div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white">Campus Support Helpdesk</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Track and resolve academic, infrastructure, administration, and technical requests.</p>
                  </div>
                  <button 
                    onClick={() => { setModalType('ticket'); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#ed143d] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ed143d]/30 transition-all hover:-translate-y-0.5 hover:bg-rose-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Submit Ticket</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { label: 'Open Tickets', value: tickets.filter(ticket => ticket.status === 'Open').length, icon: LifeBuoy, color: 'text-[#ed143d]', bg: 'bg-[#ed143d]/10' },
                    { label: 'In Progress', value: tickets.filter(ticket => ticket.status === 'In Progress').length, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Urgent', value: tickets.filter(ticket => ticket.priority === 'Urgent' && ticket.status !== 'Resolved').length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Resolved', value: tickets.filter(ticket => ticket.status === 'Resolved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl sm:p-5">
                      <div className="flex items-center justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div><span className={`text-3xl font-extrabold ${color}`}>{value}</span></div>
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="support-ticket-table overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
                    <div><h3 className="font-bold text-white">All Support Requests</h3><p className="mt-0.5 text-xs text-slate-500">{filteredTickets.length} ticket{filteredTickets.length === 1 ? '' : 's'} in the current view</p></div>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">Newest first</span>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                  {filteredTickets.map((tck) => (
                    <div key={tck.id} className="support-ticket-row group grid gap-5 p-5 transition-colors hover:bg-slate-800/30 sm:p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tck.status === 'Resolved' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : tck.priority === 'Urgent' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' : 'border-slate-700 bg-slate-800 text-[#ed143d]'}`}>
                        {tck.status === 'Resolved' ? <CheckCircle2 className="h-5 w-5" /> : <LifeBuoy className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#ed143d]">{tck.id}</span>
                          <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{tck.category}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tck.status === 'Resolved' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : tck.status === 'In Progress' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>{tck.status}</span>
                        </div>
                        <h3 className="break-words text-base font-bold leading-6 text-white">{tck.subject}</h3>
                        <p className="mt-1.5 text-xs text-slate-400">Submitted by <span className="font-semibold text-slate-300">{tck.user}</span> <span className="mx-1 text-slate-600">•</span> {tck.time}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          tck.priority === 'Urgent' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : tck.priority === 'High' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-slate-700 bg-slate-800 text-slate-300'
                        }`}>
                          {tck.priority} Priority
                        </span>

                        {tck.status !== 'Resolved' ? (
                          <button
                            onClick={() => handleResolveTicket(tck.id)}
                            className="rounded-xl bg-[#ed143d] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#ed143d]/20 transition-all hover:bg-rose-700"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && <div className="px-6 py-16 text-center"><LifeBuoy className="mx-auto mb-3 h-9 w-9 text-slate-700" /><p className="font-semibold text-slate-400">No support tickets found</p><p className="mt-1 text-xs text-slate-600">Try a different search or submit a new request.</p></div>}
                  </div>
                </div>
              </motion.div>
            )}
            </>}
            {activeTab === 'tickets' && <AdminTicketDesk />}

          </div>
        </main>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-[#ed143d]/20 z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white capitalize">
                  {modalType === 'student' && 'Register New Student'}
                  {modalType === 'assignment' && 'Create New Assignment'}
                  {modalType === 'ticket' && 'Submit Support Ticket'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
                {modalType === 'student' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Full Name</label>
                      <input name="name" required placeholder="e.g. Elena Rostova" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Email Address</label>
                      <input name="email" type="email" required placeholder="e.g. elena@edu.io" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Department</label>
                        <input name="department" defaultValue="Computer Science" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Target GPA</label>
                        <input name="gpa" defaultValue="3.85" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'assignment' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Assignment Title</label>
                      <input name="title" required placeholder="e.g. Distributed Systems Lab 04" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Course Code</label>
                        <input name="course" defaultValue="CS-401" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Deadline</label>
                        <input name="deadline" type="date" required min={new Date().toISOString().split('T')[0]} className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                      <select name="priority" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none">
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'ticket' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Subject Summary</label>
                      <input name="subject" required placeholder="e.g. Need additional GPU quota for PyTorch model" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Requested By</label>
                      <input name="user" required placeholder="e.g. Your full name" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Category</label>
                      <select name="category" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none">
                        <option value="Tech Support">Tech Support</option>
                        <option value="Academic">Academic</option>
                        <option value="Administration">Administration</option>
                        <option value="Facility">Facility</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                      <select name="priority" className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-[#ed143d] focus:outline-none">
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#ed143d] hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#ed143d]/30"
                  >
                    Save & Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
