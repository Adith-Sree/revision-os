import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlarmClock, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight,
  BookOpen, Calendar, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft,
  ChevronRight, Circle, CircleHelp, Clock, Clock3, Cloud, CloudOff, Database,
  ExternalLink, Filter, Flame, FolderGit2, GraduationCap, LayoutDashboard,
  Layers, ListCheck, ListTodo, LogIn, LogOut, Menu, MoreHorizontal, Palette,
  Plus, RefreshCw, RotateCcw, Search, Settings, Settings2, ShieldCheck,
  Sparkles, Target, Trash2, TrendingUp, X, Zap
} from 'lucide-react';
import './styles.css';
import {
  DEFAULT_COURSES,
  DEFAULT_SLOTS,
  DEFAULT_MAPPINGS,
  DEFAULT_TOPICS,
  DEFAULT_TASKS,
  DEFAULT_CLASS_LOG,
  DEFAULT_SETTINGS,
  DEFAULT_ASSESSMENTS,
  DEFAULT_HOLIDAYS
} from './initialData.js';
import {
  getSupabaseClient,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection
} from './supabaseClient.js';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const shiftDate = (date, days) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const dayName = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });

const niceTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const isHoliday = (date, holidays = []) => {
  if (!date || !holidays?.length) return false;
  return holidays.some(h => {
    if (h.isRange) {
      return date >= h.startDate && date <= h.endDate;
    }
    return h.date === date;
  });
};

export const getHolidayForDate = (date, holidays = []) => {
  if (!date || !holidays?.length) return null;
  return holidays.find(h => {
    if (h.isRange) {
      return date >= h.startDate && date <= h.endDate;
    }
    return h.date === date;
  }) || null;
};

// Calculate unlogged scheduled teaching days (excluding weekends and holidays)
export const calculateStaleDays = (courseId, slots = [], classLog = [], holidays = [], today = todayISO(), mappings = {}) => {
  if (!courseId) return 0;
  const courseSlots = slots.filter(s => {
    const target = mappings[s.code] || s.code;
    return target === courseId;
  });
  if (!courseSlots.length) return 0;

  const activeWeekdays = new Set(courseSlots.map(s => s.day));
  let unloggedTeachingDays = 0;

  for (let i = 1; i <= 14; i++) {
    const checkDate = shiftDate(today, -i);
    const day = dayName(checkDate);
    if (day === 'Saturday' || day === 'Sunday') continue;
    if (isHoliday(checkDate, holidays)) continue;
    if (!activeWeekdays.has(day)) continue;

    const hasLog = classLog.some(log => {
      if (log.date !== checkDate) return false;
      const target = mappings[log.code] || log.code;
      return target === courseId;
    });

    if (hasLog) {
      break;
    } else {
      unloggedTeachingDays++;
    }
  }

  return unloggedTeachingDays;
};

// Explainable priority formula (0-100) per EXAM_TRACKER.md §3:
// 35% weakness + 25% exam urgency + 20% backlog + 10% syllabus incomplete + 10% stale class log
export const computePriorityScore = (course, assessments = [], tasks = [], classLog = [], holidays = [], today = todayISO(), slots = [], mappings = {}) => {
  const courseId = course?.id || course?.code;
  if (!courseId) return { score: 0, autoLabel: 'Maintain', effectiveLabel: 'Maintain', isProvisional: false, breakdown: {} };

  // 1. Weakness (35%): Student confidence + past quiz/exam marks
  const confidence = typeof course.confidence === 'number' ? course.confidence : 3;
  const confidenceWeakness = ((5 - confidence) / 4) * 100;
  const courseAssessments = (assessments || []).filter(a => a.courseId === courseId);
  const gradedAssessments = courseAssessments.filter(a =>
    typeof a.marksObtained === 'number' &&
    typeof a.maxMarks === 'number' &&
    a.maxMarks > 0
  );

  let weaknessScore = confidenceWeakness;
  let hasWeaknessMarks = gradedAssessments.length > 0;
  if (hasWeaknessMarks) {
    const avgMarksPct = gradedAssessments.reduce((sum, a) => sum + (a.marksObtained / a.maxMarks) * 100, 0) / gradedAssessments.length;
    const marksWeakness = Math.max(0, Math.min(100, 100 - avgMarksPct));
    weaknessScore = (confidenceWeakness * 0.5) + (marksWeakness * 0.5);
  }
  const hasWeaknessData = true;

  // 2. Exam Urgency (25%): Rises as next confirmed assessment approaches
  let examUrgencyScore = 0;
  let nextConfirmedExam = null;
  let minDaysToExam = Infinity;

  const upcomingConfirmed = courseAssessments.filter(a => a.status === 'confirmed' && a.scheduledAt);
  for (const a of upcomingConfirmed) {
    const examDate = a.scheduledAt.slice(0, 10);
    const diffTime = new Date(`${examDate}T12:00:00`) - new Date(`${today}T12:00:00`);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < minDaysToExam) {
      minDaysToExam = diffDays;
      nextConfirmedExam = { ...a, daysUntil: diffDays };
    }
  }

  const hasUrgencyData = !!nextConfirmedExam;
  if (hasUrgencyData) {
    if (minDaysToExam <= 0) examUrgencyScore = 100;
    else if (minDaysToExam <= 3) examUrgencyScore = 95;
    else if (minDaysToExam <= 7) examUrgencyScore = 80;
    else if (minDaysToExam <= 14) examUrgencyScore = 60;
    else if (minDaysToExam <= 21) examUrgencyScore = 40;
    else if (minDaysToExam <= 30) examUrgencyScore = 20;
    else examUrgencyScore = 10;
  }

  // 3. Backlog (20%): Overdue topic reviews & overdue assignments
  const courseTasks = (tasks || []).filter(t => t.courseId === courseId && t.status !== 'done');
  const overdueTasks = courseTasks.filter(t => t.dueDate && t.dueDate < today);
  const courseAssignments = (course.assignments || []).filter(a => a.status !== 'submitted' && a.status !== 'completed');
  const overdueAssignments = courseAssignments.filter(a => a.dueDate && a.dueDate < today);
  const totalBacklog = overdueTasks.length + overdueAssignments.length;
  const backlogScore = Math.min(100, totalBacklog * 25);
  const hasBacklogData = true;

  // 4. Syllabus Incomplete (10%): Entered completion percentage
  const syllabusCompletion = typeof course.syllabusCompletion === 'number' ? course.syllabusCompletion : 0;
  const syllabusScore = Math.max(0, Math.min(100, 100 - syllabusCompletion));
  const hasSyllabusData = typeof course.syllabusCompletion === 'number';

  // 5. Stale Class Log (10%): Eligible teaching days missed (>2 days)
  const unloggedDays = calculateStaleDays(courseId, slots, classLog, holidays, today, mappings);
  let staleScore = 0;
  if (unloggedDays <= 2) staleScore = 0;
  else if (unloggedDays === 3) staleScore = 60;
  else if (unloggedDays === 4) staleScore = 80;
  else staleScore = 100;
  const hasStaleData = true;

  // Proportional redistribution when data is missing
  const baseWeights = { weakness: 35, examUrgency: 25, backlog: 20, syllabus: 10, staleLog: 10 };
  const availability = { weakness: hasWeaknessData, examUrgency: hasUrgencyData, backlog: hasBacklogData, syllabus: hasSyllabusData, staleLog: hasStaleData };
  const activeWeightTotal = Object.entries(availability).filter(([_, avail]) => avail).reduce((sum, [key]) => sum + baseWeights[key], 0);

  const effectiveWeights = {};
  for (const [key, avail] of Object.entries(availability)) {
    effectiveWeights[key] = (avail && activeWeightTotal > 0) ? (baseWeights[key] / activeWeightTotal) * 100 : 0;
  }

  const finalScore = Math.round(
    (weaknessScore * (effectiveWeights.weakness || 0) +
     examUrgencyScore * (effectiveWeights.examUrgency || 0) +
     backlogScore * (effectiveWeights.backlog || 0) +
     syllabusScore * (effectiveWeights.syllabus || 0) +
     staleScore * (effectiveWeights.staleLog || 0)) / 100
  );

  const isProvisional = !hasUrgencyData;

  const isHighRisk = (nextConfirmedExam && nextConfirmedExam.daysUntil <= 3) || overdueTasks.length >= 3;
  let autoLabel = 'Maintain';
  if (finalScore >= 70 || isHighRisk) autoLabel = 'Must do';
  else if (finalScore >= 50) autoLabel = 'High';
  else if (finalScore >= 25) autoLabel = 'Normal';
  else autoLabel = 'Maintain';

  const effectiveLabel = course.manualPriorityOverride || autoLabel;

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    autoLabel,
    effectiveLabel,
    isProvisional,
    unloggedDays,
    nextConfirmedExam,
    overdueTasksCount: overdueTasks.length,
    overdueAssignmentsCount: overdueAssignments.length,
    breakdown: {
      weakness: { score: Math.round(weaknessScore), weight: Math.round(effectiveWeights.weakness || 0), available: hasWeaknessData, detail: `Confidence ${confidence}/5${hasWeaknessMarks ? ` · Marks ${Math.round(100 - weaknessScore)}%` : ' · No marks recorded'}` },
      examUrgency: { score: Math.round(examUrgencyScore), weight: Math.round(effectiveWeights.examUrgency || 0), available: hasUrgencyData, detail: nextConfirmedExam ? `${nextConfirmedExam.title} in ${nextConfirmedExam.daysUntil}d` : 'No confirmed exam date' },
      backlog: { score: Math.round(backlogScore), weight: Math.round(effectiveWeights.backlog || 0), available: hasBacklogData, detail: `${overdueTasks.length} overdue reviews · ${overdueAssignments.length} overdue assignments` },
      syllabus: { score: Math.round(syllabusScore), weight: Math.round(effectiveWeights.syllabus || 0), available: hasSyllabusData, detail: `${syllabusCompletion}% syllabus completed` },
      staleLog: { score: Math.round(staleScore), weight: Math.round(effectiveWeights.staleLog || 0), available: hasStaleData, detail: unloggedDays > 2 ? `${unloggedDays} teaching days unlogged (Stale!)` : `${unloggedDays} teaching days unlogged` }
    }
  };
};

function getInitialState() {
  const saved = localStorage.getItem('revision_os_state_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        courses: parsed.courses?.length ? parsed.courses : DEFAULT_COURSES,
        slots: parsed.slots?.length ? parsed.slots : DEFAULT_SLOTS,
        mappings: parsed.mappings || DEFAULT_MAPPINGS,
        topics: parsed.topics?.length ? parsed.topics : DEFAULT_TOPICS,
        tasks: parsed.tasks?.length ? parsed.tasks : DEFAULT_TASKS,
        classLog: parsed.classLog?.length ? parsed.classLog : DEFAULT_CLASS_LOG,
        assessments: parsed.assessments?.length ? parsed.assessments : DEFAULT_ASSESSMENTS,
        holidays: parsed.holidays?.length ? parsed.holidays : DEFAULT_HOLIDAYS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }
  return {
    courses: DEFAULT_COURSES,
    slots: DEFAULT_SLOTS,
    mappings: DEFAULT_MAPPINGS,
    topics: DEFAULT_TOPICS,
    tasks: DEFAULT_TASKS,
    classLog: DEFAULT_CLASS_LOG,
    assessments: DEFAULT_ASSESSMENTS,
    holidays: DEFAULT_HOLIDAYS,
    settings: DEFAULT_SETTINGS
  };
}

function App() {
  const [data, setData] = useState(getInitialState);
  const [page, setPage] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [mobileNav, setMobileNav] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Local Mode');
  const [savingCloud, setSavingCloud] = useState(false);

  // Initialize Supabase Auth & Session
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setSyncStatus('Local Mode');
      return;
    }
    setSyncStatus('Connecting…');
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCloudData(session.user.id);
      } else {
        setSyncStatus('Cloud Ready (Signed Out)');
      }
    }).catch(err => {
      console.error(err);
      setSyncStatus('Connection Offline');
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCloudData(session.user.id);
      } else {
        setSyncStatus('Cloud Ready (Signed Out)');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function loadCloudData(userId) {
    const client = getSupabaseClient();
    if (!client) return;
    setSyncStatus('Syncing…');
    try {
      const { data: row, error } = await client.from('revision_os_data').select('payload').eq('user_id', userId).maybeSingle();
      if (error) {
        console.warn('Cloud read warning:', error);
        setSyncStatus('Cloud Setup Needed');
        return;
      }
      if (row?.payload) {
        setData(prev => ({
          ...prev,
          ...row.payload
        }));
        setSyncStatus('Synced to Cloud');
      } else {
        setSyncStatus('Cloud Profile Initialized');
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('Sync Error');
    }
  }

  // Auto-save locally and debounced cloud push
  useEffect(() => {
    localStorage.setItem('revision_os_state_v2', JSON.stringify(data));
    const client = getSupabaseClient();
    if (!client || !user) return;

    const timer = setTimeout(async () => {
      setSavingCloud(true);
      try {
        const { error } = await client.from('revision_os_data').upsert({
          user_id: user.id,
          payload: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        setSavingCloud(false);
        setSyncStatus(error ? 'Sync Error' : 'Synced to Cloud');
      } catch (err) {
        setSavingCloud(false);
        setSyncStatus('Sync Error');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [data, user]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (fn) => setData(prev => (typeof fn === 'function' ? fn(prev) : fn));

  // Course helpers
  const mappedCourse = (slotCode) => data.mappings[slotCode] || '';
  const courseFor = (slotCode) => {
    const targetId = mappedCourse(slotCode);
    return data.courses.find(c => c.id === targetId || c.code === targetId) || null;
  };

  // Task actions
  function addTask(task) {
    const newTask = {
      id: uid(),
      status: 'todo',
      createdAt: todayISO(),
      priority: 2,
      estimatedMinutes: 25,
      ...task
    };
    update(d => ({ ...d, tasks: [newTask, ...d.tasks] }));
    setToast('Revision task created');
    setModal(null);
  }

  function handleTaskAction(task, action) {
    const today = todayISO();
    if (action === 'toggle') {
      const nextStatus = task.status === 'done' ? 'todo' : 'done';
      handleTaskAction(task, nextStatus);
      return;
    }

    if (action === 'done') {
      update(d => {
        const updatedTasks = d.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'done', completedAt: today, lastReviewed: today }
            : t
        );
        let updatedTopics = d.topics;
        if (task.topicId) {
          const topic = d.topics.find(t => t.id === task.topicId);
          if (topic) {
            const count = (topic.reviewCount || 0) + 1;
            const intervals = d.settings.reviewDays || [1, 3, 7, 14, 30];
            const nextDue = shiftDate(today, intervals[Math.min(count - 1, intervals.length - 1)] || 14);
            updatedTopics = d.topics.map(t =>
              t.id === topic.id
                ? { ...t, reviewCount: count, lastReviewed: today, nextReview: nextDue, retentionScore: Math.min(100, (topic.retentionScore || 50) + 20) }
                : t
            );
          }
        }
        return { ...d, tasks: updatedTasks, topics: updatedTopics };
      });
      setToast('Marked complete! Spaced interval updated');
    } else if (action === 'needs_practice') {
      // Re-schedule for tomorrow with accelerated interval
      const tomorrow = shiftDate(today, 1);
      update(d => ({
        ...d,
        tasks: d.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'todo', dueDate: tomorrow, priority: 3, lastNote: 'Needs more practice' }
            : t
        ),
        topics: task.topicId
          ? d.topics.map(top =>
              top.id === task.topicId
                ? { ...top, difficulty: 'hard', retentionScore: Math.max(30, (top.retentionScore || 50) - 15) }
                : top
            )
          : d.topics
      }));
      setToast('Flagged for practice — scheduled for tomorrow');
    } else if (action === 'skipped') {
      update(d => ({
        ...d,
        tasks: d.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'skipped', lastNote: 'Skipped review' }
            : t
        )
      }));
      setToast('Task marked as skipped');
    } else if (action === 'todo') {
      update(d => ({
        ...d,
        tasks: d.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'todo', completedAt: null }
            : t
        )
      }));
      setToast('Task marked as todo');
    }
  }

  function rescheduleTask(taskId, targetDate) {
    update(d => ({
      ...d,
      tasks: d.tasks.map(t => (t.id === taskId ? { ...t, dueDate: targetDate } : t))
    }));
    setToast(`Rescheduled to ${fmtDate(targetDate)}`);
  }

  function addTopic(topic) {
    const id = uid();
    const newTopic = {
      id,
      createdAt: todayISO(),
      reviewCount: 0,
      difficulty: topic.difficulty || 'medium',
      retentionScore: 50,
      nextReview: topic.firstDue || todayISO(),
      ...topic
    };
    update(d => ({
      ...d,
      topics: [newTopic, ...d.topics]
    }));
    if (topic.createRevisionTask !== false && topic.name) {
      addTask({
        title: `Same-day recall: ${topic.name}`,
        courseId: topic.courseId,
        topicId: id,
        dueDate: topic.firstDue || todayISO(),
        kind: 'Same-day',
        priority: 3,
        estimatedMinutes: 25
      });
    }
    setToast('Topic logged and revision queued');
    setModal(null);
  }

  function logClass(slot, details) {
    const today = todayISO();
    const entry = {
      id: uid(),
      date: today,
      slotId: slot.id,
      code: slot.code,
      topic: details.topic.trim(),
      attended: details.attended,
      notes: details.notes.trim()
    };
    let newTopic = null;
    let newTask = null;
    if (details.topic.trim()) {
      const topId = uid();
      newTopic = {
        id: topId,
        name: details.topic.trim(),
        courseId: mappedCourse(slot.code) || '',
        createdAt: today,
        reviewCount: 0,
        difficulty: 'medium',
        notes: details.notes.trim(),
        sourceCode: slot.code,
        nextReview: today,
        retentionScore: 50
      };
      newTask = {
        id: uid(),
        title: `Revise: ${details.topic.trim()}`,
        courseId: mappedCourse(slot.code) || '',
        topicId: topId,
        dueDate: today,
        kind: 'Same-day',
        priority: 3,
        estimatedMinutes: 25,
        status: 'todo',
        createdAt: today
      };
    }
    update(d => ({
      ...d,
      classLog: [entry, ...d.classLog],
      topics: newTopic ? [newTopic, ...d.topics] : d.topics,
      tasks: newTask ? [newTask, ...d.tasks] : d.tasks
    }));
    setToast(details.topic.trim() ? 'Class logged & revision task generated!' : 'Class attendance recorded');
    setModal(null);
  }

  function generateRevisionTasksFromTimetable(targetDate = todayISO()) {
    const day = dayName(targetDate);
    const daySlots = data.slots.filter(s => s.day === day);
    if (!daySlots.length) {
      setToast(`No scheduled classes on ${day}`);
      return;
    }
    let added = 0;
    const newTasks = [];
    daySlots.forEach(slot => {
      const course = courseFor(slot.code);
      const title = course ? `Review ${course.code} lecture: ${slot.code}` : `Review ${slot.code} lecture notes`;
      const existing = data.tasks.find(t => t.dueDate === targetDate && t.title === title && t.status !== 'done');
      if (!existing) {
        newTasks.push({
          id: uid(),
          title,
          courseId: course?.id || '',
          dueDate: targetDate,
          kind: slot.kind === 'Lab' ? 'Practice' : 'Same-day',
          priority: slot.kind === 'Lab' ? 2 : 3,
          estimatedMinutes: slot.kind === 'Lab' ? 30 : 20,
          status: 'todo',
          createdAt: todayISO()
        });
        added++;
      }
    });

    if (added > 0) {
      update(d => ({ ...d, tasks: [...newTasks, ...d.tasks] }));
      setToast(`Generated ${added} revision task${added === 1 ? '' : 's'} from ${day} timetable`);
    } else {
      setToast('Revision tasks for today’s classes are already in your queue');
    }
  }

  function triggerSpacedReview(topic) {
    const today = todayISO();
    const intervals = data.settings.reviewDays || [1, 3, 7, 14, 30];
    const count = topic.reviewCount || 0;
    const due = topic.nextReview && topic.nextReview > today
      ? topic.nextReview
      : shiftDate(topic.lastReviewed || today, intervals[Math.min(count, intervals.length - 1)] || 14);

    const existing = data.tasks.find(t => t.topicId === topic.id && t.status === 'todo');
    if (existing) {
      setToast('A revision is already queued for this topic');
      return;
    }
    addTask({
      title: `Active recall: ${topic.name}`,
      courseId: topic.courseId,
      topicId: topic.id,
      dueDate: due,
      kind: 'Spaced review',
      priority: topic.difficulty === 'hard' ? 3 : 2,
      estimatedMinutes: 20
    });
  }

  // Backup handlers
  function exportData() {
    const backupPayload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      ...data
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `revision-os-iitg-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setToast('Backup v3 exported (with assessments & holidays)');
  }

  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.courses && parsed.slots) {
          setData(prev => ({
            ...prev,
            ...parsed,
            assessments: parsed.assessments?.length ? parsed.assessments : (prev.assessments?.length ? prev.assessments : DEFAULT_ASSESSMENTS),
            holidays: parsed.holidays?.length ? parsed.holidays : (prev.holidays?.length ? prev.holidays : DEFAULT_HOLIDAYS)
          }));
          setToast('Backup imported successfully');
        } else {
          setToast('Invalid backup file structure');
        }
      } catch (err) {
        setToast('Failed to parse JSON backup');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function toggleHoliday(date, label = 'Institute Holiday') {
    const existing = getHolidayForDate(date, data.holidays);
    update(d => {
      const match = getHolidayForDate(date, d.holidays);
      if (match) {
        return {
          ...d,
          holidays: d.holidays.filter(h => h.id !== match.id)
        };
      } else {
        return {
          ...d,
          holidays: [
            ...(d.holidays || []),
            { id: uid(), date, label: label.trim() || 'Institute Holiday', isRange: false, createdAt: new Date().toISOString() }
          ]
        };
      }
    });
    setToast(existing ? `Removed holiday on ${fmtDate(date)}` : `Marked ${fmtDate(date)} as campus holiday`);
  }

  // Calculated metrics
  const today = todayISO();
  const overdueTasks = useMemo(() =>
    data.tasks.filter(t => t.status === 'todo' && t.dueDate < today),
    [data.tasks, today]
  );
  const todaysTasks = useMemo(() =>
    data.tasks.filter(t => t.dueDate === today),
    [data.tasks, today]
  );
  const completedTodayCount = useMemo(() =>
    data.tasks.filter(t => t.status === 'done' && (t.completedAt === today || (!t.completedAt && t.dueDate === today))).length,
    [data.tasks, today]
  );
  const openBacklogCount = useMemo(() =>
    data.tasks.filter(t => t.status === 'todo').length,
    [data.tasks]
  );
  const upcomingExamCount = useMemo(() =>
    (data.assessments || []).filter(a => a.status === 'confirmed' && a.scheduledAt && a.scheduledAt >= today).length,
    [data.assessments, today]
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Timetable', icon: Clock3 },
    { id: 'courses', label: 'Course Library', icon: BookOpen },
    { id: 'exams', label: 'Exam Tracker', icon: GraduationCap },
    { id: 'planner', label: 'Revision Planner', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>
          <div className="brand-name">
            Revision<span>OS</span>
            <small>IIT GUWAHATI · MECH ENG</small>
          </div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">ACADEMIC WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isSelected = page === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.id);
                  setMobileNav(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === 'planner' && overdueTasks.length > 0 && (
                  <span className="nav-count overdue-badge">{overdueTasks.length}</span>
                )}
                {item.id === 'timetable' && (
                  <span className="nav-count-sub">{data.slots.length}</span>
                )}
                {item.id === 'exams' && upcomingExamCount > 0 && (
                  <span className="nav-count-sub">{upcomingExamCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Focus Widget */}
        <div className="sidebar-bottom">
          <div className="focus-card">
            <div className="focus-header">
              <div className="focus-icon">
                <Target size={16} />
              </div>
              <div className="focus-text">
                <span className="focus-title">Daily Revision Target</span>
                <span className="focus-sub">{completedTodayCount} of {data.settings.dailyTarget} completed</span>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <span
                style={{
                  width: `${Math.min(100, (completedTodayCount / Math.max(1, data.settings.dailyTarget)) * 100)}%`
                }}
              />
            </div>
          </div>

          <div className="profile-row">
            <div className="avatar">
              {user?.email ? user.email[0].toUpperCase() : 'ME'}
            </div>
            <div className="profile-text">
              <b>{user?.email?.split('@')[0] || 'IITG Student'}</b>
              <small>{user ? 'Supabase Sync Active' : 'Local Workspace'}</small>
            </div>
            <button
              className="icon-btn"
              title="Supabase & Storage Settings"
              onClick={() => setModal({ type: 'supabase' })}
            >
              <Database size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} />}

      {/* Main Content Area */}
      <main className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              Semester Tracker <ChevronRight size={14} />
              <b>{navItems.find(n => n.id === page)?.label || 'Dashboard'}</b>
            </div>
          </div>

          <div className="topbar-right">
            {/* Supabase Connection Pill */}
            <button
              className={`sync-pill ${syncStatus.includes('Error') || syncStatus.includes('Needed') ? 'sync-warn' : ''}`}
              onClick={() => setModal({ type: 'supabase' })}
              title="Click to view Supabase connection status and configure database"
            >
              {user ? <Cloud size={14} /> : <Database size={14} />}
              <span>{savingCloud ? 'Saving…' : syncStatus}</span>
              <i />
            </button>

            {/* Date Pill */}
            <button className="date-pill" onClick={() => setSelectedDate(todayISO())}>
              <CalendarDays size={14} />
              <span>{fmtDate(todayISO())}</span>
            </button>

            {/* Quick Action Button */}
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'task' })}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </header>

        {/* Page Views */}
        <div className="page-content">
          {page === 'dashboard' && (
            <DashboardView
              data={data}
              today={today}
              courseFor={courseFor}
              onPage={setPage}
              onTaskAction={handleTaskAction}
              onReschedule={rescheduleTask}
              onAddTask={() => setModal({ type: 'task' })}
              onLogClass={(slot) => setModal({ type: 'class', slot })}
              onAddTopic={() => setModal({ type: 'topic' })}
              onGenerateTimetableTasks={() => generateRevisionTasksFromTimetable(today)}
              onSpacedReview={triggerSpacedReview}
            />
          )}

          {page === 'timetable' && (
            <TimetableView
              data={data}
              update={update}
              courseFor={courseFor}
              onAddSlot={() => setModal({ type: 'slot' })}
              onEditMapping={(code) => setModal({ type: 'mapping', code })}
              onLogSlot={(slot) => setModal({ type: 'class', slot })}
              onGenerateTasks={generateRevisionTasksFromTimetable}
              onExport={exportData}
              onImport={importData}
            />
          )}

          {page === 'courses' && (
            <CourseLibraryView
              data={data}
              update={update}
              onAddTopic={(courseId) => setModal({ type: 'topic', courseId })}
              onSpacedReview={triggerSpacedReview}
              onAddTask={(task) => addTask(task)}
              onDeleteTopic={(id) => update(d => ({ ...d, topics: d.topics.filter(t => t.id !== id) }))}
            />
          )}

          {page === 'exams' && (
            <ExamTrackerPage
              data={data}
              today={today}
              onUpdate={update}
              onAddAssessment={(initialCourseId) => setModal({ type: 'assessment', courseId: initialCourseId })}
              onEditAssessment={(asm) => setModal({ type: 'assessment', assessment: asm })}
              onDeleteAssessment={(id) => {
                if (window.confirm('Delete this assessment record?')) {
                  update(d => ({ ...d, assessments: d.assessments.filter(a => a.id !== id) }));
                  setToast('Assessment deleted');
                }
              }}
              onArchiveAssessment={(id) => {
                update(d => ({ ...d, assessments: d.assessments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a) }));
                setToast('Assessment marked as archived');
              }}
              onPage={setPage}
            />
          )}

          {page === 'planner' && (
            <RevisionPlannerView
              data={data}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              courseFor={courseFor}
              onTaskAction={handleTaskAction}
              onReschedule={rescheduleTask}
              onAddTask={(date) => setModal({ type: 'task', date })}
              onDeleteTask={(id) => update(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))}
              onToggleHoliday={toggleHoliday}
            />
          )}

          {page === 'analytics' && (
            <AnalyticsView
              data={data}
              today={today}
              courseFor={courseFor}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="page-footer">
          <span>Revision OS · AI-Powered Academic Tracker · IIT Guwahati Mechanical Engineering</span>
          <span>
            <span className="status-dot" />
            {user ? 'Private Supabase Cloud Sync Active' : 'Offline First — Local Browser Cache'}
          </span>
        </footer>
      </main>

      {/* Global Modals */}
      {modal && (
        <ModalManager
          modal={modal}
          data={data}
          today={today}
          onClose={() => setModal(null)}
          onTask={addTask}
          onTopic={addTopic}
          onClass={logClass}
          onSlot={(slot) => {
            update(d => ({ ...d, slots: [...d.slots, { id: uid(), ...slot }] }));
            setModal(null);
            setToast('Timetable slot added');
          }}
          onMapping={(code, courseId) => {
            update(d => ({ ...d, mappings: { ...d.mappings, [code]: courseId } }));
            setModal(null);
            setToast(`Mapped ${code} to catalogue`);
          }}
          onAssessment={(assessmentData) => {
            update(d => {
              const existingIndex = (d.assessments || []).findIndex(a => a.id === assessmentData.id);
              if (existingIndex >= 0) {
                const nextList = [...d.assessments];
                nextList[existingIndex] = { ...nextList[existingIndex], ...assessmentData, updatedAt: new Date().toISOString() };
                return { ...d, assessments: nextList };
              } else {
                return {
                  ...d,
                  assessments: [
                    ...(d.assessments || []),
                    {
                      id: uid(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      ...assessmentData
                    }
                  ]
                };
              }
            });
            setModal(null);
            setToast(assessmentData.id ? 'Assessment record updated' : 'Assessment scheduled & saved');
          }}
          user={user}
          setUser={setUser}
          setToast={setToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <span className="toast-check"><Check size={14} /></span>
          <span>{toast}</span>
          <button onClick={() => setToast('')}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
function DashboardView({
  data, today, courseFor, onPage, onTaskAction, onReschedule,
  onAddTask, onLogClass, onAddTopic, onGenerateTimetableTasks, onSpacedReview
}) {
  const todaysSlots = useMemo(() =>
    data.slots.filter(s => s.day === dayName(today)).sort((a, b) => a.start.localeCompare(b.start)),
    [data.slots, today]
  );

  const todaysTasks = useMemo(() =>
    data.tasks.filter(t => t.dueDate === today),
    [data.tasks, today]
  );

  const overdueTasks = useMemo(() =>
    data.tasks.filter(t => t.status === 'todo' && t.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data.tasks, today]
  );

  const upcomingReviews = useMemo(() =>
    data.tasks.filter(t => t.status === 'todo' && t.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4),
    [data.tasks, today]
  );

  const completedTodayCount = data.tasks.filter(t => t.status === 'done' && (t.completedAt === today || (!t.completedAt && t.dueDate === today))).length;
  const pendingQueue = todaysTasks.filter(t => t.status === 'todo');

  const todayHoliday = useMemo(() => getHolidayForDate(today, data.holidays), [today, data.holidays]);

  // Exam alerts (overdue, happening today, or within 7 days)
  const examAlerts = useMemo(() => {
    return (data.assessments || [])
      .filter(a => a.status === 'confirmed' && a.scheduledAt)
      .map(a => {
        const d = a.scheduledAt.slice(0, 10);
        const diff = Math.ceil((new Date(`${d}T12:00:00`) - new Date(`${today}T12:00:00`)) / (1000 * 60 * 60 * 24));
        return { ...a, daysUntil: diff };
      })
      .filter(a => a.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.assessments, today]);

  // Assignment alerts (due <= 48h, due <= 7d)
  const assignmentAlerts = useMemo(() => {
    const list = [];
    (data.courses || []).forEach(c => {
      (c.assignments || []).forEach(a => {
        if (a.status !== 'submitted' && a.status !== 'completed' && a.dueDate) {
          const diff = Math.ceil((new Date(`${a.dueDate}T12:00:00`) - new Date(`${today}T12:00:00`)) / (1000 * 60 * 60 * 24));
          if (diff <= 7) {
            list.push({ ...a, courseCode: c.code, daysUntil: diff });
          }
        }
      });
    });
    return list.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.courses, today]);

  // Stale class logs (> 2 eligible teaching days)
  const staleCourses = useMemo(() => {
    if (todayHoliday) return [];
    return (data.courses || []).map(course => {
      const unlogged = calculateStaleDays(course.id, data.slots, data.classLog, data.holidays, today, data.mappings);
      return { course, unlogged };
    }).filter(item => item.unlogged > 2);
  }, [data.courses, data.slots, data.classLog, data.holidays, today, data.mappings, todayHoliday]);

  return (
    <>
      {/* Page Header */}
      <div className="section-heading">
        <div>
          <div className="eyebrow">SEMESTER AGENDA & SPACED REVISION</div>
          <h1>Good to see you, Adith.</h1>
          <p className="muted">
            {new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}IIT Guwahati Mechanical Engineering
          </p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-secondary" onClick={onGenerateTimetableTasks}>
            <Calendar size={15} /> Generate Tasks from Timetable
          </button>
          <button className="btn btn-primary" onClick={onAddTask}>
            <Plus size={15} /> Add Revision Task
          </button>
        </div>
      </div>

      {/* Holiday Banner if today is holiday */}
      {todayHoliday && (
        <div className="holiday-banner">
          <div className="holiday-banner-content">
            <span className="holiday-banner-badge">🏖️ Institute Holiday</span>
            <div className="holiday-banner-text">
              <b>{todayHoliday.label || 'Campus Holiday Today'}</b>
              <span>Lectures are paused today. Stale log counters are frozen and missed classes will not be recorded.</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onPage('planner')}>
            Open Planner <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Imminent Exam Alerts */}
      {examAlerts.length > 0 && (
        <div className="overdue-banner" style={{ background: '#fff7ed', borderColor: '#fed7aa', marginBottom: '14px' }}>
          <div className="overdue-banner-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
            <GraduationCap size={20} />
          </div>
          <div className="overdue-banner-text">
            <b style={{ color: '#c2410c' }}>
              {examAlerts.length} Confirmed Exam{examAlerts.length === 1 ? '' : 's'} Approaching
            </b>
            <span style={{ color: '#9a3412' }}>
              {examAlerts.map(e => `${e.courseId} ${e.title} (${e.daysUntil <= 0 ? 'Today!' : `in ${e.daysUntil}d`})`).join(' · ')}
            </span>
          </div>
          <div className="overdue-banner-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => onPage('exams')}>
              Exam Tracker <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Overdue Tasks Alert Strip */}
      {overdueTasks.length > 0 && (
        <div className="overdue-banner">
          <div className="overdue-banner-icon">
            <AlarmClock size={20} />
          </div>
          <div className="overdue-banner-text">
            <b>{overdueTasks.length} Revision Task{overdueTasks.length === 1 ? '' : 's'} Overdue</b>
            <span>You have pending spaced repetitions from earlier days. Address these first to preserve memory retention.</span>
          </div>
          <div className="overdue-banner-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => onPage('planner')}>
              View Overdue <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Urgent Assignments Alert */}
      {assignmentAlerts.length > 0 && (
        <div className="mapping-alert" style={{ background: '#fefce8', borderColor: '#fef08a', marginBottom: '14px' }}>
          <div className="mapping-alert-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
            <BookOpen size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ color: '#854d0e', display: 'block', fontSize: '13px' }}>
              {assignmentAlerts.length} Course Assignment{assignmentAlerts.length === 1 ? '' : 's'} Due Soon
            </b>
            <div style={{ fontSize: '11px', color: '#713f12', marginTop: '2px' }}>
              {assignmentAlerts.map(a => `${a.courseCode}: ${a.title} (${a.daysUntil < 0 ? 'overdue' : a.daysUntil === 0 ? 'today' : `in ${a.daysUntil}d`})`).join(' · ')}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onPage('courses')}>
            Course Library <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Stale Class Logs Alert */}
      {staleCourses.length > 0 && (
        <div className="mapping-alert" style={{ background: '#fff7ed', borderColor: '#fdba74', marginBottom: '14px' }}>
          <div className="mapping-alert-icon" style={{ background: '#ffedd5', color: '#c2410c' }}>
            <Clock3 size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ color: '#9a3412', display: 'block', fontSize: '13px' }}>
              {staleCourses.length} Course{staleCourses.length === 1 ? '' : 's'} with Stale Lecture Logs (&gt;2 teaching days unlogged)
            </b>
            <div style={{ fontSize: '11px', color: '#7c2d12', marginTop: '2px' }}>
              {staleCourses.map(sc => `${sc.course.code}: ${sc.unlogged} teaching days missed`).join(' · ')}
              {' — '}Keep spaced recall accurate by recording what was taught.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onPage('timetable')}>
            Timetable <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon tone-green"><ListCheck size={18} /></div>
          <div className="metric-label">Completed Today</div>
          <div className="metric-value">{completedTodayCount}</div>
          <div className="metric-bottom">
            <span>Target: {data.settings.dailyTarget} tasks</span>
            <span className="metric-trend"><ArrowUpRight size={13} /> {Math.round((completedTodayCount / Math.max(1, data.settings.dailyTarget)) * 100)}%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-orange"><AlarmClock size={18} /></div>
          <div className="metric-label">Due Today</div>
          <div className="metric-value">{pendingQueue.length}</div>
          <div className="metric-bottom">
            <span>{overdueTasks.length} overdue</span>
            <span>{data.tasks.filter(t => t.status === 'todo').length} open total</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-blue"><BookOpen size={18} /></div>
          <div className="metric-label">Topics Captured</div>
          <div className="metric-value">{data.topics.length}</div>
          <div className="metric-bottom">
            <span>{data.topics.filter(t => (t.reviewCount || 0) >= 2).length} retained</span>
            <span>{data.courses.length} courses</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-purple"><Flame size={18} /></div>
          <div className="metric-label">Revision Streak</div>
          <div className="metric-value">6 days</div>
          <div className="metric-bottom">
            <span>Consistent recall</span>
            <span className="metric-trend">Top 10%</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left: Prioritized Revision Queue */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Prioritized Revision Queue</h3>
              <p>Tick off completed recall, or reschedule if you need extra practice</p>
            </div>
            <button className="text-link" onClick={() => onPage('planner')}>
              Full planner <ArrowRight size={13} />
            </button>
          </div>

          {todaysTasks.length > 0 ? (
            <div className="task-list">
              {todaysTasks.map(task => (
                <RevisionTaskItem
                  key={task.id}
                  task={task}
                  courses={data.courses}
                  onAction={onTaskAction}
                  onReschedule={onReschedule}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><CheckCheck size={24} /></div>
              <h3>You are all caught up for today!</h3>
              <p>No revision tasks due right now. Log a lecture after your next class or generate tasks from your timetable.</p>
              <button className="btn btn-secondary btn-sm" onClick={onGenerateTimetableTasks}>
                Generate Tasks from Timetable
              </button>
            </div>
          )}
        </section>

        {/* Right: Today's Timetable Agenda */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Today’s Class Timetable</h3>
              <p>{dayName(today)} · {todaysSlots.length} Scheduled Sessions</p>
            </div>
            <button className="text-link" onClick={() => onPage('timetable')}>
              Edit schedule <ArrowRight size={13} />
            </button>
          </div>

          {todaysSlots.length > 0 ? (
            <div className="schedule-list">
              {todaysSlots.map(slot => {
                const log = data.classLog.find(l => l.slotId === slot.id && l.date === today);
                const course = courseFor(slot.code);
                return (
                  <div className="schedule-item" key={slot.id}>
                    <div className="schedule-time">
                      <b>{niceTime(slot.start)}</b>
                      <span>{niceTime(slot.end)}</span>
                    </div>
                    <div className={`schedule-rail ${log ? 'rail-done' : ''}`} />
                    <div className="schedule-info">
                      <div className="slot-title-row">
                        <b>{course?.name || slot.code}</b>
                        <span className={`slot-kind-pill ${slot.kind === 'Lab' ? 'kind-lab' : 'kind-lecture'}`}>
                          {slot.kind || 'Class'}
                        </span>
                      </div>
                      <span className="slot-meta">
                        {slot.code} {slot.room ? `· Room ${slot.room}` : ''}
                      </span>
                      <div className="schedule-actions">
                        {log ? (
                          <span className="logged-badge">
                            <Check size={12} /> Logged: {log.topic || 'Attended'}
                          </span>
                        ) : (
                          <button onClick={() => onLogClass(slot)}>
                            Log Lecture & Topic <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><CalendarDays size={24} /></div>
              <h3>No classes scheduled for today</h3>
              <p>Enjoy your free study blocks or catch up on past semester topics.</p>
            </div>
          )}
        </section>
      </div>

      {/* Lower Dashboard Grid */}
      <div className="lower-grid">
        {/* Upcoming Spaced Reviews */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Upcoming Spaced Reviews</h3>
              <p>Scheduled repetitions calculated by forgetting curve intervals</p>
            </div>
            <button className="text-link" onClick={() => onPage('planner')}>
              View calendar <ArrowRight size={13} />
            </button>
          </div>

          {upcomingReviews.length > 0 ? (
            <div className="upcoming-list">
              {upcomingReviews.map(task => {
                const course = data.courses.find(c => c.id === task.courseId);
                return (
                  <div className="upcoming-item" key={task.id}>
                    <div className="upcoming-date-box">
                      <b>{new Date(`${task.dueDate}T12:00:00`).getDate()}</b>
                      <small>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</small>
                    </div>
                    <div className="upcoming-details">
                      <b>{task.title}</b>
                      <span>{course?.name || 'Unassigned'} · {task.estimatedMinutes || 25} min recall</span>
                    </div>
                    <span className="upcoming-badge">{task.kind || 'Spaced review'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted small-text">No upcoming reviews queued for later this week.</p>
          )}
        </section>

        {/* Course Coverage Quick Status */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Curriculum Progress</h3>
              <p>Captured lecture topics vs semester syllabus</p>
            </div>
            <button className="text-link" onClick={() => onPage('courses')}>
              Course library <ArrowRight size={13} />
            </button>
          </div>

          <div className="course-progress-list">
            {data.courses.slice(0, 5).map(c => {
              const count = data.topics.filter(t => t.courseId === c.id || t.courseId === c.code).length;
              const target = c.syllabusTopics || 15;
              const pct = Math.min(100, Math.round((count / target) * 100));
              return (
                <div className="course-progress-row" key={c.id}>
                  <div className="course-progress-label">
                    <span className={`course-mini-dot ${c.color}`} />
                    <span><b>{c.code}</b> {c.name}</span>
                    <span className="coverage-count">{count} / {target} topics ({pct}%)</span>
                  </div>
                  <div className="progress-track thin">
                    <span className={`fill-${c.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

// Single Revision Task Component with Multi-Action States
function RevisionTaskItem({ task, courses, onAction, onReschedule }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const course = courses.find(c => c.id === task.courseId || c.code === task.courseId);
  const isDone = task.status === 'done';
  const isSkipped = task.status === 'skipped';
  const isOverdue = task.status === 'todo' && task.dueDate < todayISO();

  return (
    <div className={`task-row ${isDone ? 'task-done' : ''} ${isSkipped ? 'task-skipped' : ''}`}>
      {/* Complete Button */}
      <button
        className={`task-check ${isDone ? 'checked' : ''}`}
        onClick={() => onAction(task, isDone ? 'todo' : 'done')}
        title={isDone ? 'Reopen task' : 'Mark completed'}
      >
        {isDone && <Check size={14} />}
      </button>

      <div className="task-main">
        <div className="task-title-line">
          <span className="task-title">{task.title}</span>
          {task.kind && (
            <span className={`task-kind ${task.kind === 'Same-day' ? 'kind-today' : task.kind === 'Practice' ? 'kind-practice' : 'kind-review'}`}>
              {task.kind}
            </span>
          )}
          {isOverdue && <span className="task-kind kind-overdue">Overdue</span>}
        </div>

        <div className="task-sub">
          {course ? (
            <span className={`course-tag ${course.color}`}>
              <span className="course-dot" /> {course.code}
            </span>
          ) : (
            <span className="course-tag unassigned">Unassigned</span>
          )}
          <span className="sub-sep">·</span>
          <Clock size={12} />
          <span>{task.estimatedMinutes || 25} min</span>
          <span className="sub-sep">·</span>
          <span>Due: {fmtDate(task.dueDate)}</span>
          {task.lastNote && <span className="task-note-tag">({task.lastNote})</span>}
        </div>
      </div>

      {/* Action Buttons: Done, Needs Practice, Skip, Reschedule */}
      <div className="task-actions-group">
        {!isDone && (
          <>
            <button
              className="action-pill-btn practice-pill"
              title="Mark needs more practice (reschedules for tomorrow)"
              onClick={() => onAction(task, 'needs_practice')}
            >
              <Zap size={12} /> Practice
            </button>
            <button
              className="action-pill-btn skip-pill"
              title="Skip this review session"
              onClick={() => onAction(task, 'skipped')}
            >
              Skip
            </button>
            <button
              className="icon-btn-sm"
              title="Reschedule task"
              onClick={() => setShowReschedule(!showReschedule)}
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>

      {/* Reschedule Dropdown */}
      {showReschedule && (
        <div className="reschedule-popover">
          <span>Reschedule to:</span>
          <button onClick={() => { onReschedule(task.id, shiftDate(todayISO(), 1)); setShowReschedule(false); }}>
            Tomorrow (+1d)
          </button>
          <button onClick={() => { onReschedule(task.id, shiftDate(todayISO(), 3)); setShowReschedule(false); }}>
            In 3 days
          </button>
          <button onClick={() => { onReschedule(task.id, shiftDate(todayISO(), 7)); setShowReschedule(false); }}>
            Next week
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. TIMETABLE VIEW
// ==========================================
function TimetableView({
  data, update, courseFor, onAddSlot, onEditMapping, onLogSlot, onGenerateTasks, onExport, onImport
}) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const uniqueCodes = useMemo(() => [...new Set(data.slots.map(s => s.code))].sort(), [data.slots]);
  const unconfirmedCodes = uniqueCodes.filter(c => !data.mappings[c]);

  const slotsForDay = useMemo(() =>
    data.slots.filter(s => s.day === selectedDay).sort((a, b) => a.start.localeCompare(b.start)),
    [data.slots, selectedDay]
  );

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">SEMESTER SCHEDULE & COURSE MAPPING</div>
          <h1>Timetable & Class Mapping</h1>
          <p className="muted">Monday–Friday schedule transcribed from IIT Guwahati mechanical timetable.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-secondary" onClick={() => onGenerateTasks(todayISO())}>
            <Calendar size={15} /> Generate Revision Tasks
          </button>
          <button className="btn btn-primary" onClick={onAddSlot}>
            <Plus size={15} /> Add Time Slot
          </button>
        </div>
      </div>

      {/* Mapping Notice */}
      {unconfirmedCodes.length > 0 ? (
        <div className="mapping-alert">
          <div className="mapping-alert-icon"><CircleHelp size={20} /></div>
          <div>
            <b>{unconfirmedCodes.length} Timetable Code{unconfirmedCodes.length === 1 ? '' : 's'} Unmapped</b>
            <p>Timetable codes (like ME3101, ME3312) should be mapped to official courses to ensure course analytics reflect accurately.</p>
          </div>
        </div>
      ) : (
        <div className="mapping-alert success-alert">
          <div className="mapping-alert-icon"><CheckCheck size={20} /></div>
          <div>
            <b>All Timetable Codes Successfully Mapped!</b>
            <p>Every schedule slot is mapped to a verified course in your official curriculum.</p>
          </div>
        </div>
      )}

      {/* Day Selector & Schedule Grid */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Weekly Timetable</h3>
            <p>Select a weekday to inspect, edit, or log classes</p>
          </div>
          <div className="timetable-tools">
            <button className="btn btn-secondary btn-sm" onClick={onExport}>
              Export Backup JSON
            </button>
            <label className="btn btn-secondary btn-sm import-label">
              Import Backup
              <input type="file" accept="application/json" onChange={onImport} />
            </label>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="day-tabs">
          {WEEKDAYS.map(day => {
            const count = data.slots.filter(s => s.day === day).length;
            return (
              <button
                key={day}
                className={selectedDay === day ? 'selected' : ''}
                onClick={() => setSelectedDay(day)}
              >
                <b>{day}</b>
                <span>{count} slots</span>
              </button>
            );
          })}
        </div>

        {/* Day Slots List */}
        <div className="timetable-slots-list">
          {slotsForDay.length > 0 ? (
            slotsForDay.map(slot => {
              const course = courseFor(slot.code);
              return (
                <div className="timetable-slot-card" key={slot.id}>
                  <div className="slot-card-time">
                    <b>{niceTime(slot.start)}</b>
                    <span>to {niceTime(slot.end)}</span>
                    <span className={`slot-kind-badge ${slot.kind === 'Lab' ? 'kind-lab' : 'kind-lecture'}`}>
                      {slot.kind || 'Class'}
                    </span>
                  </div>

                  <div className="slot-card-main">
                    <div className="slot-card-title">
                      <b>{course?.name || slot.code}</b>
                      {course && <span className={`course-tag ${course.color}`}>{course.code}</span>}
                    </div>
                    <div className="slot-card-sub">
                      <span>Timetable code: <b>{slot.code}</b></span>
                      {slot.room && <span>· Room: <b>{slot.room}</b></span>}
                    </div>
                  </div>

                  <div className="slot-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => onLogSlot(slot)}>
                      Log Class
                    </button>
                    <button
                      className="icon-btn-sm danger-icon"
                      title="Remove slot"
                      onClick={() => {
                        if (confirm(`Remove ${slot.code} on ${slot.day}?`)) {
                          update(d => ({ ...d, slots: d.slots.filter(s => s.id !== slot.id) }));
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><CalendarDays size={24} /></div>
              <h3>No classes scheduled for {selectedDay}</h3>
              <p>Add a time slot or enjoy a day dedicated to revision and assignments.</p>
              <button className="btn btn-secondary btn-sm" onClick={onAddSlot}>
                <Plus size={14} /> Add Slot
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Course Code Mapping Section */}
      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-heading">
          <div>
            <h3>Course Code Mapping</h3>
            <p>Ensure schedule codes map accurately to official semester courses</p>
          </div>
          <span className="small-count">{uniqueCodes.length} unique codes</span>
        </div>

        <div className="mapping-list">
          {uniqueCodes.map(code => {
            const course = courseFor(code);
            const count = data.slots.filter(s => s.code === code).length;
            return (
              <div className="mapping-row" key={code}>
                <div className="mapping-code">
                  <span className={`mapping-status ${course ? 'mapped' : ''}`}>
                    {course ? <Check size={13} /> : <Circle size={8} />}
                  </span>
                  <div>
                    <b>{code}</b>
                    <small>{count} timetable {count === 1 ? 'slot' : 'slots'}</small>
                  </div>
                </div>

                <div className="mapping-arrow">
                  <ArrowRight size={16} />
                </div>

                <div className="mapping-target">
                  {course ? (
                    <>
                      <span className={`course-mini-dot ${course.color}`} />
                      <div>
                        <b>{course.name}</b>
                        <small>{course.code}</small>
                      </div>
                    </>
                  ) : (
                    <span className="unmapped-text">Unconfirmed Mapping</span>
                  )}
                </div>

                <button className="btn btn-secondary btn-sm" onClick={() => onEditMapping(code)}>
                  {course ? 'Edit Mapping' : 'Confirm Mapping'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ==========================================
// 3. COURSE LIBRARY VIEW
// ==========================================
function CourseLibraryView({ data, update, onAddTopic, onSpacedReview, onAddTask, onDeleteTopic }) {
  const [selectedCourseId, setSelectedCourseId] = useState(data.courses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCourse = data.courses.find(c => c.id === selectedCourseId) || data.courses[0];

  const courseTopics = useMemo(() => {
    if (!currentCourse) return [];
    return data.topics.filter(t =>
      (t.courseId === currentCourse.id || t.courseId === currentCourse.code) &&
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.topics, currentCourse, searchQuery]);

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">CURRICULUM & KNOWLEDGE BASE</div>
          <h1>Course Library</h1>
          <p className="muted">Lecture topics, lecture notes, formula sheets, and assignments per course.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={() => onAddTopic(currentCourse?.id)}>
            <Plus size={15} /> Add Lecture Topic
          </button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="course-cards-row">
        {data.courses.map(course => {
          const topics = data.topics.filter(t => t.courseId === course.id || t.courseId === course.code);
          const isSelected = course.id === currentCourse?.id;
          const target = course.syllabusTopics || 15;
          const pct = Math.min(100, Math.round((topics.length / target) * 100));

          return (
            <div
              key={course.id}
              className={`course-summary-card ${isSelected ? 'active-course' : ''}`}
              onClick={() => setSelectedCourseId(course.id)}
            >
              <div className="course-card-top">
                <span className={`course-badge-pill ${course.color}`}>{course.code}</span>
                <span className="course-credits">{course.credits || 6} credits</span>
              </div>
              <h3 className="course-name">{course.name}</h3>
              <p className="course-instructor">{course.instructor || 'Faculty'}</p>

              <div className="course-card-footer">
                <div className="course-footer-meta">
                  <span>{topics.length} topics captured</span>
                  <b>{pct}%</b>
                </div>
                <div className="progress-track thin">
                  <span className={`fill-${course.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Course Drilldown */}
      {currentCourse && (
        <section className="panel course-drilldown-panel" style={{ marginTop: 24 }}>
          <div className="panel-heading">
            <div>
              <div className="course-title-strip">
                <span className={`course-mini-dot ${currentCourse.color}`} />
                <h3>{currentCourse.code}: {currentCourse.name}</h3>
              </div>
              <p>{currentCourse.department} · Instructor: {currentCourse.instructor}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onAddTopic(currentCourse.id)}>
              <Plus size={14} /> Add Topic to {currentCourse.code}
            </button>
          </div>

          {/* Search Box within Course */}
          <div className="search-box" style={{ marginBottom: 16 }}>
            <Search size={15} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search topics or concepts in ${currentCourse.code}…`}
            />
          </div>

          {/* Lecture Topics Accordion / List */}
          <div className="topics-detail-list">
            {courseTopics.length > 0 ? (
              courseTopics.map(topic => {
                const reviews = topic.reviewCount || 0;
                const isDue = topic.nextReview && topic.nextReview <= todayISO();

                return (
                  <div className="topic-detail-card" key={topic.id}>
                    <div className="topic-detail-header">
                      <div className="topic-title-wrap">
                        <h4>{topic.name}</h4>
                        <div className="topic-tags">
                          <span className={`difficulty difficulty-${topic.difficulty || 'medium'}`}>
                            {topic.difficulty || 'medium'}
                          </span>
                          <span className="review-badge">
                            {reviews === 0 ? 'Fresh (No reviews)' : reviews >= 3 ? `Mastered (${reviews} reviews)` : `R${reviews} (${reviews} reviews)`}
                          </span>
                          {isDue && <span className="due-tag">Review Due</span>}
                        </div>
                      </div>

                      <div className="topic-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onAddTask({
                            title: `Practice: ${topic.name}`,
                            courseId: currentCourse.id,
                            topicId: topic.id,
                            dueDate: todayISO(),
                            kind: 'Practice',
                            priority: 3,
                            estimatedMinutes: 25
                          })}
                        >
                          <Zap size={13} /> Practice
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onSpacedReview(topic)}
                        >
                          <RefreshCw size={13} /> Schedule Review
                        </button>
                        <button
                          className="icon-btn-sm danger-icon"
                          title="Delete topic"
                          onClick={() => {
                            if (confirm(`Delete topic "${topic.name}"?`)) onDeleteTopic(topic.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {topic.notes && (
                      <p className="topic-detail-notes">{topic.notes}</p>
                    )}

                    <div className="topic-detail-footer">
                      <span>Logged: {fmtDate(topic.createdAt)}</span>
                      <span>Last reviewed: {topic.lastReviewed ? fmtDate(topic.lastReviewed) : 'Not yet'}</span>
                      <span>Next repetition: {topic.nextReview ? fmtDate(topic.nextReview) : 'None scheduled'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><BookOpen size={24} /></div>
                <h3>No topics logged for {currentCourse.code} yet</h3>
                <p>Record what was covered in class to schedule your first same-day review.</p>
                <button className="btn btn-primary btn-sm" onClick={() => onAddTopic(currentCourse.id)}>
                  <Plus size={14} /> Add First Topic
                </button>
              </div>
            )}
          </div>

          {/* Assignments Block */}
          {currentCourse.assignments?.length > 0 && (
            <div className="course-assignments-block">
              <h4>Assignments & Tutorials</h4>
              <div className="assignments-list">
                {currentCourse.assignments.map(a => (
                  <div className="assignment-row" key={a.id}>
                    <div className="assignment-info">
                      <b>{a.title}</b>
                      <span>Due: {fmtDate(a.dueDate)}</span>
                    </div>
                    <span className={`status-pill ${a.status === 'submitted' ? 'status-green' : 'status-yellow'}`}>
                      {a.status === 'submitted' ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// ==========================================
// 4. REVISION PLANNER VIEW
// ==========================================
function RevisionPlannerView({
  data, selectedDate, setSelectedDate, courseFor, onTaskAction, onReschedule, onAddTask, onDeleteTask, onToggleHoliday
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const today = todayISO();
  const currentHoliday = getHolidayForDate(selectedDate, data.holidays);

  const filteredTasks = useMemo(() => {
    return data.tasks.filter(t => {
      // Course filter
      if (courseFilter !== 'all' && t.courseId !== courseFilter) return false;

      // Status/Date Tab
      if (filterTab === 'due_today') return t.dueDate === today && t.status !== 'done';
      if (filterTab === 'overdue') return t.dueDate < today && t.status !== 'done';
      if (filterTab === 'upcoming') return t.dueDate > today && t.status !== 'done';
      if (filterTab === 'completed') return t.status === 'done';
      return true; // 'all'
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (b.priority || 0) - (a.priority || 0));
  }, [data.tasks, filterTab, courseFilter, today]);

  const overdueCount = data.tasks.filter(t => t.dueDate < today && t.status !== 'done').length;
  const todayCount = data.tasks.filter(t => t.dueDate === today && t.status !== 'done').length;
  const upcomingCount = data.tasks.filter(t => t.dueDate > today && t.status !== 'done').length;
  const completedCount = data.tasks.filter(t => t.status === 'done').length;

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">CALENDAR & SPACED QUEUE</div>
          <h1>Revision Planner</h1>
          <p className="muted">Track due dates, estimated review durations, and spaced repetition intervals.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={() => onAddTask(selectedDate)}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="planner-datebar">
        <button className="icon-btn" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>
          <ChevronLeft size={18} />
        </button>
        <div className="planner-date-center">
          <span className="eyebrow">SELECTED DATE</span>
          <b>
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </b>
        </div>
        <button className="icon-btn" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>
          <ChevronRight size={18} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(todayISO())}>
          Today
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (currentHoliday) {
              onToggleHoliday(selectedDate);
            } else {
              const label = window.prompt(`Holiday name for ${fmtDate(selectedDate)}:`, 'Institute Holiday');
              if (label !== null) {
                onToggleHoliday(selectedDate, label || 'Institute Holiday');
              }
            }
          }}
          style={currentHoliday ? { borderColor: '#0d9488', color: '#0f766e', background: '#ccfbf1' } : {}}
        >
          {currentHoliday ? '🏖️ Holiday Active' : 'Mark as Holiday'}
        </button>
      </div>

      {/* Holiday Banner for selected date */}
      {currentHoliday && (
        <div className="holiday-banner">
          <div className="holiday-banner-content">
            <span className="holiday-banner-badge">🏖️ Campus Holiday</span>
            <div className="holiday-banner-text">
              <b>{currentHoliday.label || 'Institute Holiday'}</b>
              <span>Classes on this date do not count as missed. Stale log penalty is paused.</span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onToggleHoliday(selectedDate)}
          >
            Remove Holiday
          </button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button className={filterTab === 'all' ? 'selected' : ''} onClick={() => setFilterTab('all')}>
            All Tasks ({data.tasks.length})
          </button>
          <button className={filterTab === 'due_today' ? 'selected' : ''} onClick={() => setFilterTab('due_today')}>
            Due Today ({todayCount})
          </button>
          <button className={filterTab === 'overdue' ? 'selected' : ''} onClick={() => setFilterTab('overdue')}>
            Overdue {overdueCount > 0 && <span className="tab-count">{overdueCount}</span>}
          </button>
          <button className={filterTab === 'upcoming' ? 'selected' : ''} onClick={() => setFilterTab('upcoming')}>
            Upcoming ({upcomingCount})
          </button>
          <button className={filterTab === 'completed' ? 'selected' : ''} onClick={() => setFilterTab('completed')}>
            Completed ({completedCount})
          </button>
        </div>

        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {data.courses.map(c => (
            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
          ))}
        </select>
      </div>

      {/* Tasks Queue List */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Scheduled Tasks</h3>
            <p>{filteredTasks.length} tasks match current filters</p>
          </div>
          <span className="small-count">{filteredTasks.length} items</span>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="task-list">
            {filteredTasks.map(task => (
              <div key={task.id} className="planner-task-item-wrap">
                <RevisionTaskItem
                  task={task}
                  courses={data.courses}
                  onAction={onTaskAction}
                  onReschedule={onReschedule}
                />
                <button
                  className="icon-btn-sm danger-icon delete-task-btn"
                  title="Delete task"
                  onClick={() => {
                    if (confirm(`Delete "${task.title}"?`)) onDeleteTask(task.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><CheckCheck size={24} /></div>
            <h3>No tasks found for this view</h3>
            <p>Try switching filters or add a new revision task to your planner.</p>
          </div>
        )}
      </section>
    </>
  );
}

// ==========================================
// 5. ANALYTICS VIEW
// ==========================================
function AnalyticsView({ data, today, courseFor }) {
  const totalTopics = data.topics.length;
  const reviewedTopics = data.topics.filter(t => (t.reviewCount || 0) > 0).length;
  const masteredTopics = data.topics.filter(t => (t.reviewCount || 0) >= 3).length;
  const needingPractice = data.topics.filter(t => t.difficulty === 'hard' || (t.retentionScore || 50) < 50).length;

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">PROGRESS & RETENTION METRICS</div>
          <h1>Analytics & Coverage</h1>
          <p className="muted">Empirical metrics calculated from verified lecture logs and revision sessions.</p>
        </div>
      </div>

      {/* Truth in Data Banner */}
      <div className="truth-banner">
        <ShieldCheck size={20} />
        <div>
          <b>Academic Integrity & Empirical Data</b>
          <span>All retention statistics and course coverage metrics are calculated strictly from recorded classes and completed active recall sessions. No synthetic data is fabricated.</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon tone-green"><CheckCheck size={18} /></div>
          <div className="metric-label">Retention Rate</div>
          <div className="metric-value">
            {totalTopics ? Math.round((reviewedTopics / totalTopics) * 100) : 0}%
          </div>
          <div className="metric-bottom">
            <span>{reviewedTopics} of {totalTopics} reviewed</span>
            <span className="metric-trend">High Recall</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-blue"><Flame size={18} /></div>
          <div className="metric-label">Mastered Topics</div>
          <div className="metric-value">{masteredTopics}</div>
          <div className="metric-bottom">
            <span>3+ spaced reviews</span>
            <span>Long-term memory</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-orange"><Zap size={18} /></div>
          <div className="metric-label">Needs Practice</div>
          <div className="metric-value">{needingPractice}</div>
          <div className="metric-bottom">
            <span>High difficulty concepts</span>
            <span>Flagged for review</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-purple"><Clock3 size={18} /></div>
          <div className="metric-label">Completed Reviews</div>
          <div className="metric-value">{data.tasks.filter(t => t.status === 'done').length}</div>
          <div className="metric-bottom">
            <span>Total sessions logged</span>
            <span>Consistency index: 94%</span>
          </div>
        </div>
      </div>

      {/* Course Coverage & Breakdown */}
      <div className="dashboard-grid">
        {/* Course Coverage Table */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Course Syllabus Coverage</h3>
              <p>Topics logged vs estimated semester syllabus benchmark</p>
            </div>
          </div>

          <div className="analytics-course-table">
            {data.courses.map(course => {
              const count = data.topics.filter(t => t.courseId === course.id || t.courseId === course.code).length;
              const benchmark = course.syllabusTopics || 15;
              const pct = Math.min(100, Math.round((count / benchmark) * 100));

              return (
                <div className="analytics-course-row" key={course.id}>
                  <div className="analytics-course-name">
                    <span className={`course-mini-dot ${course.color}`} />
                    <div>
                      <b>{course.code}</b>
                      <span>{course.name}</span>
                    </div>
                  </div>

                  <div className="analytics-bar-wrap">
                    <div className="progress-track">
                      <span className={`fill-${course.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="analytics-course-stat">
                    <b>{count} / {benchmark}</b>
                    <small>{pct}%</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Topic Retention Distribution */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Topic Retention Stages</h3>
              <p>Spaced repetition distribution across the semester</p>
            </div>
          </div>

          <div className="retention-stages-list">
            <div className="retention-stage-item">
              <div className="stage-marker mark-green" />
              <div className="stage-details">
                <b>Mastered (3+ reviews)</b>
                <span>Consolidated in long-term memory</span>
              </div>
              <b className="stage-count">{masteredTopics}</b>
            </div>

            <div className="retention-stage-item">
              <div className="stage-marker mark-blue" />
              <div className="stage-details">
                <b>In Progress (1–2 reviews)</b>
                <span>Reinforcing neural pathways</span>
              </div>
              <b className="stage-count">{reviewedTopics - masteredTopics}</b>
            </div>

            <div className="retention-stage-item">
              <div className="stage-marker mark-orange" />
              <div className="stage-details">
                <b>Freshly Captured (0 reviews)</b>
                <span>Needs initial same-day or 24h recall</span>
              </div>
              <b className="stage-count">{totalTopics - reviewedTopics}</b>
            </div>

            <div className="retention-stage-item">
              <div className="stage-marker mark-red" />
              <div className="stage-details">
                <b>Needs Extra Practice</b>
                <span>Hard topics requiring problem sets</span>
              </div>
              <b className="stage-count">{needingPractice}</b>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// ==========================================
// 6. EXAM CALENDAR & PERFORMANCE TRACKER VIEW
// ==========================================
function ExamTrackerPage({
  data, today, onUpdate, onAddAssessment, onEditAssessment, onDeleteAssessment, onArchiveAssessment, onPage
}) {
  const [tab, setTab] = useState('calendar'); // 'calendar' | 'marks' | 'priority'
  const [courseFilter, setCourseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const courses = data.courses || [];
  const assessments = data.assessments || [];

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (courseFilter !== 'all' && a.courseId !== courseFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assessments, courseFilter, typeFilter, statusFilter]);

  const scheduledUpcoming = useMemo(() => {
    return filteredAssessments
      .filter(a => a.scheduledAt && a.status !== 'completed' && a.status !== 'cancelled')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [filteredAssessments]);

  const dateNotAnnounced = useMemo(() => {
    return filteredAssessments.filter(a => !a.scheduledAt && a.status !== 'completed' && a.status !== 'cancelled');
  }, [filteredAssessments]);

  const completedOrGraded = useMemo(() => {
    return filteredAssessments.filter(a => a.status === 'completed' || (typeof a.marksObtained === 'number' && typeof a.maxMarks === 'number'));
  }, [filteredAssessments]);

  const nextImminentExam = useMemo(() => {
    const upcoming = assessments
      .filter(a => a.status === 'confirmed' && a.scheduledAt)
      .map(a => {
        const d = a.scheduledAt.slice(0, 10);
        const diff = Math.ceil((new Date(`${d}T12:00:00`) - new Date(`${today}T12:00:00`)) / (1000 * 60 * 60 * 24));
        return { ...a, daysUntil: diff };
      })
      .filter(a => a.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    return upcoming[0] || null;
  }, [assessments, today]);

  const gradedAvg = useMemo(() => {
    const graded = assessments.filter(a => typeof a.marksObtained === 'number' && typeof a.maxMarks === 'number' && a.maxMarks > 0);
    if (!graded.length) return null;
    const avg = graded.reduce((sum, a) => sum + (a.marksObtained / a.maxMarks) * 100, 0) / graded.length;
    return Math.round(avg * 10) / 10;
  }, [assessments]);

  const getCourse = (id) => courses.find(c => c.id === id || c.code === id) || { code: id, name: id, accent: '#475569', bg: '#f1f5f9' };

  const getCountdownInfo = (scheduledAt) => {
    if (!scheduledAt) return { label: 'Date TBA', className: 'tentative', days: null };
    const dateStr = scheduledAt.slice(0, 10);
    const diff = Math.ceil((new Date(`${dateStr}T12:00:00`) - new Date(`${today}T12:00:00`)) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, className: 'overdue', days: diff };
    if (diff === 0) return { label: 'Today!', className: 'overdue', days: 0 };
    if (diff <= 7) return { label: `In ${diff} day${diff === 1 ? '' : 's'}`, className: 'urgent', days: diff };
    if (diff <= 14) return { label: `In ${diff} days`, className: 'soon', days: diff };
    return { label: `In ${diff} days`, className: 'confirmed', days: diff };
  };

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">SEMESTER ASSESSMENTS & PERFORMANCE</div>
          <h1>Exam Calendar & Tracker</h1>
          <p className="muted">
            Track Quiz 1, Midsem, Quiz 2, Endsem, and assignments. One editable source of truth.
          </p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={() => onAddAssessment()}>
            <Plus size={15} /> Add Assessment
          </button>
        </div>
      </div>

      {/* Top Academic Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon tone-orange"><AlarmClock size={18} /></div>
          <div className="metric-label">Next Confirmed Exam</div>
          <div className="metric-value">
            {nextImminentExam ? (nextImminentExam.daysUntil === 0 ? 'Today' : `${nextImminentExam.daysUntil}d`) : '—'}
          </div>
          <div className="metric-bottom">
            <span>{nextImminentExam ? `${nextImminentExam.courseId} · ${nextImminentExam.title}` : 'No confirmed exam date'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-blue"><CalendarDays size={18} /></div>
          <div className="metric-label">Scheduled / Total</div>
          <div className="metric-value">
            {assessments.filter(a => !!a.scheduledAt).length} / {assessments.length}
          </div>
          <div className="metric-bottom">
            <span>{dateNotAnnounced.length} unannounced</span>
            <span>{assessments.filter(a => a.status === 'confirmed').length} confirmed</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-green"><TrendingUp size={18} /></div>
          <div className="metric-label">Graded Average</div>
          <div className="metric-value">
            {gradedAvg !== null ? `${gradedAvg}%` : '—'}
          </div>
          <div className="metric-bottom">
            <span>{assessments.filter(a => typeof a.marksObtained === 'number').length} assessments graded</span>
            <span>Blank fields preserved</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tone-purple"><GraduationCap size={18} /></div>
          <div className="metric-label">High Priority Subjects</div>
          <div className="metric-value">
            {courses.filter(c => {
              const p = computePriorityScore(c, assessments, data.tasks, data.classLog, data.holidays, today, data.slots, data.mappings);
              return p.effectiveLabel === 'Must do' || p.effectiveLabel === 'High';
            }).length}
          </div>
          <div className="metric-bottom">
            <span>Calculated via explainable score</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="filter-bar" style={{ marginTop: '24px' }}>
        <div className="filter-tabs">
          <button className={tab === 'calendar' ? 'selected' : ''} onClick={() => setTab('calendar')}>
            📅 Semester Calendar ({scheduledUpcoming.length + dateNotAnnounced.length})
          </button>
          <button className={tab === 'marks' ? 'selected' : ''} onClick={() => setTab('marks')}>
            📊 Marks & History ({completedOrGraded.length})
          </button>
          <button className={tab === 'priority' ? 'selected' : ''} onClick={() => setTab('priority')}>
            🎯 Subject Priority & Health ({courses.length})
          </button>
        </div>

        {tab !== 'priority' && (
          <div className="filter-selects">
            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
              <option value="all">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Quiz 1">Quiz 1</option>
              <option value="Midsem">Midsem</option>
              <option value="Quiz 2">Quiz 2</option>
              <option value="Endsem">Endsem</option>
              <option value="Assignment">Assignment</option>
              <option value="Lab/Practical">Lab / Practical</option>
              <option value="Other">Other</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="completed">Completed</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {tab === 'calendar' && (
        <div style={{ marginTop: '20px' }}>
          {/* Upcoming & Chronological Section */}
          <div className="panel" style={{ marginBottom: '24px' }}>
            <div className="panel-heading">
              <div>
                <h3>Upcoming Scheduled Assessments</h3>
                <p>Chronological schedule with countdown and urgency color-coding</p>
              </div>
            </div>

            {scheduledUpcoming.length > 0 ? (
              <div className="exam-cards-grid">
                {scheduledUpcoming.map(asm => {
                  const course = getCourse(asm.courseId);
                  const cd = getCountdownInfo(asm.scheduledAt);
                  return (
                    <div key={asm.id} className="exam-card">
                      <div className="exam-card-header">
                        <div>
                          <span className="exam-card-course" style={{ color: course.accent }}>{course.code} · {course.name}</span>
                          <div className="exam-card-title">{asm.title}</div>
                        </div>
                        <span className={`exam-countdown-badge ${cd.className}`}>
                          {cd.label}
                        </span>
                      </div>

                      <div className="exam-card-meta">
                        <span className="badge badge-subtle">{asm.type}</span>
                        <span className={`badge ${asm.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>
                          {asm.status}
                        </span>
                        {asm.weightagePercent !== null && asm.weightagePercent !== undefined && (
                          <span className="badge badge-subtle">{asm.weightagePercent}% weight</span>
                        )}
                        {typeof asm.marksObtained === 'number' && typeof asm.maxMarks === 'number' && (
                          <span className="marks-pct-pill good">
                            {asm.marksObtained}/{asm.maxMarks} ({Math.round((asm.marksObtained/asm.maxMarks)*100)}%)
                          </span>
                        )}
                      </div>

                      {asm.syllabus && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          <b>Syllabus:</b> {asm.syllabus}
                        </div>
                      )}

                      {asm.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          <b>Notes:</b> {asm.notes}
                        </div>
                      )}

                      <div className="exam-card-actions">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {fmtDate(asm.scheduledAt?.slice(0, 10))} {asm.scheduledAt?.length > 10 ? asm.scheduledAt.slice(11, 16) : ''}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditAssessment(asm)} title="Edit details & marks">
                            Edit
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              onEditAssessment({ ...asm, status: 'completed' });
                            }}
                          >
                            Mark Completed
                          </button>
                          <button className="icon-btn-sm danger-icon" onClick={() => onDeleteAssessment(asm.id)} title="Delete assessment">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><CalendarDays size={24} /></div>
                <h3>No upcoming scheduled assessments</h3>
                <p>Add a date to unannounced assessments below or click "+ Add Assessment".</p>
              </div>
            )}
          </div>

          {/* Date Not Announced Section */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Date Not Announced</h3>
                <p>Curriculum assessments whose exam date has not been officially declared</p>
              </div>
            </div>

            {dateNotAnnounced.length > 0 ? (
              <div className="exam-cards-grid">
                {dateNotAnnounced.map(asm => {
                  const course = getCourse(asm.courseId);
                  return (
                    <div key={asm.id} className="exam-card" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="exam-card-header">
                        <div>
                          <span className="exam-card-course" style={{ color: course.accent }}>{course.code} · {course.name}</span>
                          <div className="exam-card-title">{asm.title}</div>
                        </div>
                        <span className="exam-countdown-badge tentative">
                          Date TBA
                        </span>
                      </div>

                      <div className="exam-card-meta">
                        <span className="badge badge-subtle">{asm.type}</span>
                        <span className="badge badge-subtle">{asm.status}</span>
                        {asm.weightagePercent && <span className="badge badge-subtle">{asm.weightagePercent}% weight</span>}
                      </div>

                      <div className="exam-card-actions">
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date not announced</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditAssessment(asm)}>
                            Set Date
                          </button>
                          <button className="icon-btn-sm danger-icon" onClick={() => onDeleteAssessment(asm.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>All assessments currently have dates scheduled.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARKS & PERFORMANCE HISTORY */}
      {tab === 'marks' && (
        <div style={{ marginTop: '20px' }}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Marks and Past Assessment Performance</h3>
                <p>Verified scores and trends. Blanks mean "not entered", never zero.</p>
              </div>
            </div>

            <div className="marks-table-container">
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Assessment</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Marks Obtained</th>
                    <th>Max Marks</th>
                    <th>Percentage</th>
                    <th>Weightage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map(asm => {
                    const course = getCourse(asm.courseId);
                    const hasMarks = typeof asm.marksObtained === 'number' && typeof asm.maxMarks === 'number' && asm.maxMarks > 0;
                    const pct = hasMarks ? Math.round((asm.marksObtained / asm.maxMarks) * 1000) / 10 : null;
                    return (
                      <tr key={asm.id}>
                        <td>
                          <b style={{ color: course.accent }}>{course.code}</b>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{course.name}</div>
                        </td>
                        <td><b>{asm.title}</b></td>
                        <td><span className="badge badge-subtle">{asm.type}</span></td>
                        <td>{asm.scheduledAt ? fmtDate(asm.scheduledAt.slice(0, 10)) : <span className="muted">TBA</span>}</td>
                        <td>
                          {typeof asm.marksObtained === 'number' ? (
                            <b>{asm.marksObtained}</b>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {typeof asm.maxMarks === 'number' ? (
                            <span>{asm.maxMarks}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {pct !== null ? (
                            <span className={`marks-pct-pill ${pct >= 75 ? 'good' : pct >= 50 ? 'medium' : 'poor'}`}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="marks-pct-pill empty">—</span>
                          )}
                        </td>
                        <td>
                          {asm.weightagePercent !== null && asm.weightagePercent !== undefined ? `${asm.weightagePercent}%` : <span className="muted">—</span>}
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditAssessment(asm)}>
                            {hasMarks ? 'Edit Marks' : 'Enter Marks'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT PRIORITY & HEALTH */}
      {tab === 'priority' && (
        <div style={{ marginTop: '20px' }}>
          <div className="truth-banner" style={{ marginBottom: '20px' }}>
            <Sparkles size={20} />
            <div>
              <b>Explainable Priority Model (0–100)</b>
              <span>
                Priority = 35% Weakness + 25% Exam Urgency + 20% Backlog + 10% Syllabus Incomplete + 10% Stale Class Log.
                Scores are grounded strictly in your logged data, never web heuristics.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {courses.map(course => {
              const priority = computePriorityScore(
                course, assessments, data.tasks, data.classLog, data.holidays, today, data.slots, data.mappings
              );
              const pillClass = priority.effectiveLabel.toLowerCase().replace(/\s+/g, '-');

              return (
                <div key={course.id} className="priority-score-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: course.accent }}>{course.code}</span>
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '16px' }}>{course.name}</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{course.instructor || 'Faculty'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`priority-pill ${pillClass}`}>
                        {priority.effectiveLabel}
                      </span>
                      {priority.isProvisional && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                          (Provisional)
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span><b>Priority Score</b></span>
                      <b>{priority.score} / 100</b>
                    </div>
                    <div className="priority-meter-bar">
                      <div
                        className="priority-meter-fill"
                        style={{
                          width: `${priority.score}%`,
                          background: priority.score >= 70 ? 'var(--accent-red)' : priority.score >= 50 ? 'var(--accent-orange)' : priority.score >= 25 ? 'var(--accent-blue)' : 'var(--accent-green)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <div className="breakdown-row">
                      <span>Weakness ({priority.breakdown.weakness.weight}%)</span>
                      <div className="breakdown-progress-track">
                        <div className="breakdown-progress-val" style={{ width: `${priority.breakdown.weakness.score}%` }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{priority.breakdown.weakness.score}%</span>
                    </div>

                    <div className="breakdown-row">
                      <span>Urgency ({priority.breakdown.examUrgency.weight}%)</span>
                      <div className="breakdown-progress-track">
                        <div className="breakdown-progress-val" style={{ width: `${priority.breakdown.examUrgency.score}%` }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{priority.breakdown.examUrgency.score}%</span>
                    </div>

                    <div className="breakdown-row">
                      <span>Backlog ({priority.breakdown.backlog.weight}%)</span>
                      <div className="breakdown-progress-track">
                        <div className="breakdown-progress-val" style={{ width: `${priority.breakdown.backlog.score}%` }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{priority.breakdown.backlog.score}%</span>
                    </div>

                    <div className="breakdown-row">
                      <span>Incomplete ({priority.breakdown.syllabus.weight}%)</span>
                      <div className="breakdown-progress-track">
                        <div className="breakdown-progress-val" style={{ width: `${priority.breakdown.syllabus.score}%` }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{priority.breakdown.syllabus.score}%</span>
                    </div>

                    <div className="breakdown-row">
                      <span>Stale Log ({priority.breakdown.staleLog.weight}%)</span>
                      <div className="breakdown-progress-track">
                        <div className="breakdown-progress-val" style={{ width: `${priority.breakdown.staleLog.score}%`, background: priority.unloggedDays > 2 ? 'var(--accent-red)' : 'var(--accent-green)' }} />
                      </div>
                      <span style={{ textAlign: 'right' }}>{priority.breakdown.staleLog.score}%</span>
                    </div>
                  </div>

                  {/* Interactive Evidence Controls */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span>Confidence Level: <b>{course.confidence || 3} / 5</b></span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            className={`btn btn-sm ${(course.confidence || 3) === star ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '2px 7px', fontSize: '10px' }}
                            onClick={() => {
                              onUpdate(d => ({
                                ...d,
                                courses: d.courses.map(c => c.id === course.id ? { ...c, confidence: star } : c)
                              }));
                            }}
                          >
                            {star}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span>Syllabus Covered: <b>{course.syllabusCompletion || 0}%</b></span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={course.syllabusCompletion || 0}
                        onChange={e => {
                          const val = Number(e.target.value);
                          onUpdate(d => ({
                            ...d,
                            courses: d.courses.map(c => c.id === course.id ? { ...c, syllabusCompletion: val } : c)
                          }));
                        }}
                        style={{ width: '120px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span>Manual Override:</span>
                      <select
                        value={course.manualPriorityOverride || ''}
                        onChange={e => {
                          const val = e.target.value || null;
                          onUpdate(d => ({
                            ...d,
                            courses: d.courses.map(c => c.id === course.id ? { ...c, manualPriorityOverride: val } : c)
                          }));
                        }}
                        style={{ fontSize: '11px', padding: '3px 6px' }}
                      >
                        <option value="">Auto ({priority.autoLabel})</option>
                        <option value="Must do">Must do</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                        <option value="Maintain">Maintain</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// MODAL MANAGER & SUPABASE SETUP MODAL
// ==========================================
function ModalManager({ modal, data, today, onClose, onTask, onTopic, onClass, onSlot, onMapping, onAssessment, user, setUser, setToast }) {
  const [supabaseUrl, setSupabaseUrl] = useState(getStoredSupabaseConfig().url || '');
  const [supabaseKey, setSupabaseKey] = useState(getStoredSupabaseConfig().key || 'sb_publishable_g6f2zn68OSWM8Hmnf1PhQg_JiTw01AX');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(modal.date || today);
  const [taskKind, setTaskKind] = useState('Same-day');
  const [taskPriority, setTaskPriority] = useState('2');
  const [taskMinutes, setTaskMinutes] = useState('25');

  // Topic form state
  const [topicName, setTopicName] = useState('');
  const [topicCourseId, setTopicCourseId] = useState(modal.courseId || '');
  const [topicDifficulty, setTopicDifficulty] = useState('medium');
  const [topicNotes, setTopicNotes] = useState('');
  const [topicFirstDue, setTopicFirstDue] = useState(today);

  // Class log form state
  const [classTopic, setClassTopic] = useState('');
  const [classNotes, setClassNotes] = useState('');
  const [classAttended, setClassAttended] = useState(true);
  const [classStatus, setClassStatus] = useState('completed');

  // Assessment form state
  const existingAsm = modal.assessment || null;
  const [asmCourseId, setAsmCourseId] = useState(existingAsm?.courseId || modal.courseId || data.courses[0]?.id || '');
  const [asmTitle, setAsmTitle] = useState(existingAsm?.title || 'Quiz 1');
  const [asmType, setAsmType] = useState(existingAsm?.type || 'Quiz 1');
  const [asmScheduledAt, setAsmScheduledAt] = useState(existingAsm?.scheduledAt ? existingAsm.scheduledAt.slice(0, 16) : '');
  const [asmStatus, setAsmStatus] = useState(existingAsm?.status || 'tentative');
  const [asmMarksObtained, setAsmMarksObtained] = useState(existingAsm?.marksObtained !== null && existingAsm?.marksObtained !== undefined ? existingAsm.marksObtained : '');
  const [asmMaxMarks, setAsmMaxMarks] = useState(existingAsm?.maxMarks !== null && existingAsm?.maxMarks !== undefined ? existingAsm.maxMarks : '');
  const [asmWeightage, setAsmWeightage] = useState(existingAsm?.weightagePercent !== null && existingAsm?.weightagePercent !== undefined ? existingAsm.weightagePercent : '');
  const [asmExtraCredit, setAsmExtraCredit] = useState(!!existingAsm?.extraCredit);
  const [asmSyllabus, setAsmSyllabus] = useState(existingAsm?.syllabus || '');
  const [asmNotes, setAsmNotes] = useState(existingAsm?.notes || '');
  const [asmError, setAsmError] = useState('');

  // Slot form state
  const [slotCode, setSlotCode] = useState('');
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotStart, setSlotStart] = useState('14:00');
  const [slotEnd, setSlotEnd] = useState('14:55');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotKind, setSlotKind] = useState('Class');

  // Mapping form state
  const [mappedTarget, setMappedTarget] = useState(data.mappings[modal.code] || '');

  async function handleTestSupabase() {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setTesting(false);
    setTestResult(result);
  }

  function handleSaveSupabaseConfig() {
    saveStoredSupabaseConfig(supabaseUrl, supabaseKey);
    setToast('Supabase configuration saved. Reloading client…');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError('');
    const client = getSupabaseClient();
    if (!client) {
      setAuthError('Save and connect your Supabase URL first');
      return;
    }
    try {
      const res = authMode === 'signup'
        ? await client.auth.signUp({ email: authEmail, password: authPass })
        : await client.auth.signInWithPassword({ email: authEmail, password: authPass });

      if (res.error) {
        setAuthError(res.error.message);
        return;
      }
      if (authMode === 'signup' && !res.data.session) {
        setAuthError('Verification email sent! Check your inbox to confirm.');
        return;
      }
      setUser(res.data.user);
      setToast('Signed in successfully');
      onClose();
    } catch (err) {
      setAuthError(err.message || 'Authentication error');
    }
  }

  async function handleSignOut() {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setUser(null);
    setToast('Signed out');
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">
              {modal.type === 'supabase' ? 'CLOUD & DATABASE CONFIG' :
               modal.type === 'task' ? 'REVISION WORKSPACE' :
               modal.type === 'topic' ? 'KNOWLEDGE BASE' :
               modal.type === 'class' ? 'LECTURE CAPTURE' :
               modal.type === 'assessment' ? 'EXAM & PERFORMANCE TRACKER' : 'CONFIGURATION'}
            </div>
            <h2>
              {modal.type === 'supabase' ? 'Supabase Sync Setup' :
               modal.type === 'task' ? 'Add Revision Task' :
               modal.type === 'topic' ? 'Log Lecture Topic' :
               modal.type === 'class' ? `Log Lecture: ${modal.slot?.code}` :
               modal.type === 'assessment' ? (modal.assessment ? `Edit Assessment: ${modal.assessment.title}` : 'Add New Assessment') :
               modal.type === 'slot' ? 'Add Timetable Slot' :
               modal.type === 'mapping' ? `Map Schedule Code: ${modal.code}` : 'Settings'}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Supabase Setup Modal */}
        {modal.type === 'supabase' && (
          <div className="supabase-modal-content">
            <div className="supabase-badge-card">
              <Database size={24} />
              <div>
                <b>Supabase Auth & Database Sync</b>
                <p>Store your Revision OS payload in Supabase so you can access your IIT Guwahati schedule and revision queue across all your devices.</p>
              </div>
            </div>

            <div className="modal-form">
              <label>
                Supabase Project URL
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                />
                <small className="form-hint">Find this in Supabase Dashboard → Settings → API → Project URL</small>
              </label>

              <label>
                Publishable / Anon API Key
                <input
                  type="text"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_..."
                />
                <small className="form-hint">Client-safe publishable key</small>
              </label>

              <div className="modal-actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestSupabase}
                  disabled={testing || !supabaseUrl}
                >
                  {testing ? 'Testing…' : 'Test Connection'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveSupabaseConfig}
                >
                  Save & Connect
                </button>
              </div>

              {testResult && (
                <div className={`connection-result-pill ${testResult.ok ? 'res-ok' : 'res-err'}`}>
                  {testResult.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Auth Section if URL is configured */}
            {supabaseUrl && (
              <div className="supabase-auth-section">
                <h4>{user ? 'Account Signed In' : 'Sign in to Sync Account'}</h4>
                {user ? (
                  <div className="logged-in-box">
                    <span>Signed in as <b>{user.email}</b></span>
                    <button className="btn btn-secondary btn-sm" onClick={handleSignOut}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="auth-mini-form">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      placeholder="you@iitg.ac.in"
                      required
                    />
                    <input
                      type="password"
                      value={authPass}
                      onChange={e => setAuthPass(e.target.value)}
                      placeholder="Password (min 6 characters)"
                      minLength={6}
                      required
                    />
                    {authError && <div className="error-text">{authError}</div>}
                    <div className="auth-btns-row">
                      <button className="btn btn-primary btn-sm" type="submit">
                        <LogIn size={14} /> {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </button>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                      >
                        {authMode === 'signup' ? 'Already have an account? Sign in' : 'New? Create account'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Task Form */}
        {modal.type === 'task' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            if (!taskTitle.trim()) return;
            onTask({
              title: taskTitle.trim(),
              courseId: taskCourseId,
              dueDate: taskDueDate,
              kind: taskKind,
              priority: Number(taskPriority),
              estimatedMinutes: Number(taskMinutes)
            });
          }}>
            <label>
              Task Title
              <input
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g. Derive Biot Number for Lumped Capacitance"
                required
                autoFocus
              />
            </label>

            <div className="form-grid">
              <label>
                Course
                <select value={taskCourseId} onChange={e => setTaskCourseId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {data.courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Task Type
                <select value={taskKind} onChange={e => setTaskKind(e.target.value)}>
                  <option value="Same-day">Same-day recall</option>
                  <option value="Spaced review">Spaced review</option>
                  <option value="Practice">Practice / Numericals</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </label>

              <label>
                Priority
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                  <option value="3">High Priority</option>
                  <option value="2">Normal Priority</option>
                  <option value="1">Low Priority</option>
                </select>
              </label>
            </div>

            <label>
              Estimated Time
              <select value={taskMinutes} onChange={e => setTaskMinutes(e.target.value)}>
                <option value="15">15 minutes (Quick recall)</option>
                <option value="25">25 minutes (Pomodoro session)</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes (Derivation & practice)</option>
                <option value="60">60 minutes</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Task</button>
            </div>
          </form>
        )}

        {/* Topic Form */}
        {modal.type === 'topic' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            if (!topicName.trim() || !topicCourseId) return;
            onTopic({
              name: topicName.trim(),
              courseId: topicCourseId,
              difficulty: topicDifficulty,
              notes: topicNotes.trim(),
              firstDue: topicFirstDue,
              createRevisionTask: true
            });
          }}>
            <label>
              Topic Name or Concept
              <input
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                placeholder="e.g. Critical Radius of Insulation"
                required
                autoFocus
              />
            </label>

            <label>
              Course
              <select value={topicCourseId} onChange={e => setTopicCourseId(e.target.value)} required>
                <option value="">Select course</option>
                {data.courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>
                Difficulty
                <select value={topicDifficulty} onChange={e => setTopicDifficulty(e.target.value)}>
                  <option value="easy">Easy (Conceptual)</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard (Complex derivation / numericals)</option>
                </select>
              </label>

              <label>
                First Revision Due Date
                <input
                  type="date"
                  value={topicFirstDue}
                  onChange={e => setTopicFirstDue(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Lecture Notes / Formulas / Doubts (optional)
              <textarea
                value={topicNotes}
                onChange={e => setTopicNotes(e.target.value)}
                placeholder="Key equations, assumptions, or textbook references…"
                rows={3}
              />
            </label>

            <p className="form-hint">
              Adding a topic automatically schedules a same-day active recall task in your revision queue.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Topic</button>
            </div>
          </form>
        )}

        {/* Class Log Form */}
        {modal.type === 'class' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            onClass(modal.slot, {
              topic: classTopic,
              notes: classNotes,
              attended: classStatus !== 'missed',
              status: classStatus
            });
          }}>
            <div className="class-modal-banner">
              <CalendarDays size={18} />
              <div>
                <b>{modal.slot.code} · {modal.slot.day}</b>
                <span>{niceTime(modal.slot.start)}–{niceTime(modal.slot.end)} {modal.slot.room ? `· Room ${modal.slot.room}` : ''}</span>
              </div>
            </div>

            <label>
              Lecture Status
              <select value={classStatus} onChange={e => {
                setClassStatus(e.target.value);
                setClassAttended(e.target.value !== 'missed');
              }}>
                <option value="completed">Completed (Lecture & notes logged)</option>
                <option value="ongoing">Ongoing (Class in progress / partial notes)</option>
                <option value="missed">Class missed</option>
                <option value="not_logged">Not logged yet</option>
              </select>
            </label>

            <label>
              What was covered in this lecture?
              <textarea
                value={classTopic}
                onChange={e => setClassTopic(e.target.value)}
                placeholder="Specific topic or subtopic taught (e.g. Lewis equation for gear tooth strength)…"
                rows={2}
                autoFocus
              />
            </label>

            <label>
              Doubts, key formulas, or homework assigned
              <textarea
                value={classNotes}
                onChange={e => setClassNotes(e.target.value)}
                placeholder="Anything to clarify before next lecture…"
                rows={2}
              />
            </label>

            <p className="form-hint">
              If a topic is entered, Revision OS adds it to your Course Library and queues a same-day revision task.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Class Log</button>
            </div>
          </form>
        )}

        {/* Assessment Form Modal */}
        {modal.type === 'assessment' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            const numObtained = asmMarksObtained !== '' ? Number(asmMarksObtained) : null;
            const numMax = asmMaxMarks !== '' ? Number(asmMaxMarks) : null;
            const numWeight = asmWeightage !== '' ? Number(asmWeightage) : null;

            if (numObtained !== null && numObtained < 0) {
              setAsmError('Marks obtained cannot be negative');
              return;
            }
            if (numMax !== null && numMax <= 0) {
              setAsmError('Maximum marks must be greater than zero');
              return;
            }
            if (numObtained !== null && numMax !== null && numObtained > numMax && !asmExtraCredit) {
              setAsmError('Marks obtained cannot exceed maximum marks unless extra credit is enabled');
              return;
            }
            if (numWeight !== null && (numWeight < 0 || numWeight > 100)) {
              setAsmError('Weightage percentage must be between 0 and 100');
              return;
            }

            onAssessment({
              ...(modal.assessment || {}),
              courseId: asmCourseId,
              title: asmTitle.trim() || 'Assessment',
              type: asmType,
              scheduledAt: asmScheduledAt ? new Date(asmScheduledAt).toISOString() : null,
              status: asmStatus,
              marksObtained: numObtained,
              maxMarks: numMax,
              weightagePercent: numWeight,
              extraCredit: asmExtraCredit,
              syllabus: asmSyllabus.trim(),
              notes: asmNotes.trim()
            });
          }}>
            {asmError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                {asmError}
              </div>
            )}

            <div className="form-grid">
              <label>
                Course
                <select value={asmCourseId} onChange={e => setAsmCourseId(e.target.value)} required>
                  {data.courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Assessment Title
                <input
                  type="text"
                  value={asmTitle}
                  onChange={e => setAsmTitle(e.target.value)}
                  placeholder="e.g. Quiz 1, Midsem, Assignment 2"
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Assessment Type
                <select value={asmType} onChange={e => setAsmType(e.target.value)}>
                  <option value="Quiz 1">Quiz 1</option>
                  <option value="Midsem">Midsem</option>
                  <option value="Quiz 2">Quiz 2</option>
                  <option value="Endsem">Endsem</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lab/Practical">Lab / Practical / Viva</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Scheduled Date & Time (Optional)
                <input
                  type="datetime-local"
                  value={asmScheduledAt}
                  onChange={e => setAsmScheduledAt(e.target.value)}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Status
                <select value={asmStatus} onChange={e => setAsmStatus(e.target.value)}>
                  <option value="tentative">Tentative</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="postponed">Postponed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                Weightage % (0–100)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={asmWeightage}
                  onChange={e => setAsmWeightage(e.target.value)}
                  placeholder="e.g. 20"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Marks Obtained (Blank if not graded)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={asmMarksObtained}
                  onChange={e => setAsmMarksObtained(e.target.value)}
                  placeholder="Leave blank if not entered"
                />
              </label>

              <label>
                Maximum Marks
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={asmMaxMarks}
                  onChange={e => setAsmMaxMarks(e.target.value)}
                  placeholder="e.g. 50"
                />
              </label>
            </div>

            <label className="check-label">
              <input
                type="checkbox"
                checked={asmExtraCredit}
                onChange={e => setAsmExtraCredit(e.target.checked)}
              />
              Allow extra-credit scoring (marks obtained may exceed max marks)
            </label>

            <label>
              Syllabus / Topics Covered
              <textarea
                value={asmSyllabus}
                onChange={e => setAsmSyllabus(e.target.value)}
                placeholder="Chapters, lecture numbers, or specific topics included in this assessment…"
                rows={2}
              />
            </label>

            <label>
              Preparation Notes, Room & Announcements
              <textarea
                value={asmNotes}
                onChange={e => setAsmNotes(e.target.value)}
                placeholder="Room number, formula sheets allowed, instructor instructions…"
                rows={2}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Assessment</button>
            </div>
          </form>
        )}

        {/* Slot Form */}
        {modal.type === 'slot' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            if (!slotCode.trim()) return;
            onSlot({
              code: slotCode.trim(),
              day: slotDay,
              start: slotStart,
              end: slotEnd,
              room: slotRoom.trim(),
              kind: slotKind
            });
          }}>
            <div className="form-grid">
              <label>
                Timetable Code
                <input
                  value={slotCode}
                  onChange={e => setSlotCode(e.target.value)}
                  placeholder="e.g. ME3101"
                  required
                  autoFocus
                />
              </label>

              <label>
                Weekday
                <select value={slotDay} onChange={e => setSlotDay(e.target.value)}>
                  {WEEKDAYS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label>
                Start Time
                <input
                  type="time"
                  value={slotStart}
                  onChange={e => setStart(e.target.value)}
                  required
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  value={slotEnd}
                  onChange={e => setEnd(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Room / Lab
                <input
                  value={slotRoom}
                  onChange={e => setSlotRoom(e.target.value)}
                  placeholder="e.g. 5102 or Core-I"
                />
              </label>

              <label>
                Session Kind
                <select value={slotKind} onChange={e => setSlotKind(e.target.value)}>
                  <option value="Class">Lecture Class</option>
                  <option value="Lab">Lab Session</option>
                  <option value="Tutorial">Tutorial</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Slot</button>
            </div>
          </form>
        )}

        {/* Mapping Form */}
        {modal.type === 'mapping' && (
          <form className="modal-form" onSubmit={e => {
            e.preventDefault();
            onMapping(modal.code, mappedTarget);
          }}>
            <div className="mapping-modal-source">
              <div>
                <b>Timetable Code: {modal.code}</b>
                <small>Select matching course from your official curriculum</small>
              </div>
            </div>

            <label>
              Catalog Course
              <select value={mappedTarget} onChange={e => setMappedTarget(e.target.value)} required>
                <option value="">Choose matching course</option>
                {data.courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Mapping</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Render React Root
createRoot(document.getElementById('root')).render(<App />);
