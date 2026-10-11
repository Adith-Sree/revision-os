// Realistic IIT Guwahati Mechanical Engineering Curriculum Sample Data

export const DEFAULT_COURSES = [
  {
    id: 'ME 311',
    code: 'ME 311',
    name: 'Heat Transfer',
    department: 'Mechanical Engineering',
    credits: 8,
    color: 'orange',
    accent: '#ea580c',
    bg: '#ffedd5',
    instructor: 'Prof. S. Gautam',
    syllabusTopics: 18,
    assignments: [
      { id: 'a1', title: 'Problem Sheet 3: Fins with variable cross-section', dueDate: '2026-10-18', status: 'pending' },
      { id: 'a2', title: 'Numerical 2D Conduction in ANSYS', dueDate: '2026-10-25', status: 'not_started' }
    ]
  },
  {
    id: 'ME 312',
    code: 'ME 312',
    name: 'Manufacturing Technology - II',
    department: 'Mechanical Engineering',
    credits: 6,
    color: 'green',
    accent: '#16a34a',
    bg: '#dcfce7',
    instructor: 'Prof. U. S. Dixit',
    syllabusTopics: 16,
    assignments: [
      { id: 'a3', title: 'Tutorial 4: Merchant circle force calculations', dueDate: '2026-10-15', status: 'submitted' }
    ]
  },
  {
    id: 'ME 313',
    code: 'ME 313',
    name: 'Dynamics of Machinery',
    department: 'Mechanical Engineering',
    credits: 6,
    color: 'pink',
    accent: '#db2777',
    bg: '#fce7f3',
    instructor: 'Prof. R. Tiwari',
    syllabusTopics: 15,
    assignments: [
      { id: 'a4', title: 'Multi-cylinder engine balancing MATLAB code', dueDate: '2026-10-22', status: 'pending' }
    ]
  },
  {
    id: 'ME 314',
    code: 'ME 314',
    name: 'Design of Machine Elements',
    department: 'Mechanical Engineering',
    credits: 8,
    color: 'yellow',
    accent: '#d97706',
    bg: '#fef3c7',
    instructor: 'Prof. K. S. R. Krishna Murthy',
    syllabusTopics: 20,
    assignments: [
      { id: 'a5', title: 'Design calculation sheet: Spur gear train', dueDate: '2026-10-20', status: 'pending' }
    ]
  },
  {
    id: 'EE 380',
    code: 'EE 380',
    name: 'Electrical Machines',
    department: 'Electrical Engineering',
    credits: 6,
    color: 'blue',
    accent: '#2563eb',
    bg: '#dbeafe',
    instructor: 'Prof. P. Kumar',
    syllabusTopics: 14,
    assignments: [
      { id: 'a6', title: 'Assignment 2: Induction motor circle diagrams', dueDate: '2026-10-16', status: 'pending' }
    ]
  },
  {
    id: 'HSS Game Theory',
    code: 'HSS Game Theory',
    name: 'HSS Game Theory',
    department: 'Humanities & Social Sciences',
    credits: 6,
    color: 'purple',
    accent: '#9333ea',
    bg: '#f3e8ff',
    instructor: 'Prof. B. Goswami',
    syllabusTopics: 12,
    assignments: [
      { id: 'a7', title: 'Case analysis: Bertrand vs Cournot in airline oligopoly', dueDate: '2026-10-19', status: 'submitted' }
    ]
  },
  {
    id: 'ME 315',
    code: 'ME 315',
    name: 'Mechanical Engineering Lab - III',
    department: 'Mechanical Engineering',
    credits: 3,
    color: 'teal',
    accent: '#0d9488',
    bg: '#ccfbf1',
    instructor: 'Prof. Lab Incharge',
    syllabusTopics: 8,
    assignments: []
  },
  {
    id: 'MINOR',
    code: 'MINOR',
    name: 'Minor in Data Science / CSE',
    department: 'Computer Science',
    credits: 6,
    color: 'gray',
    accent: '#475569',
    bg: '#f1f5f9',
    instructor: 'Guest Faculty',
    syllabusTopics: 12,
    assignments: []
  }
];

// Timetable transcribed from the official IITG timetable
export const DEFAULT_SLOTS = [
  { id: 's1', day: 'Monday', start: '09:00', end: '12:00', code: 'ME3101L (B)', room: 'Thermal Lab', kind: 'Lab' },
  { id: 's2', day: 'Thursday', start: '09:00', end: '12:00', code: 'ME3101L (A)', room: 'Machining Lab', kind: 'Lab' },
  { id: 's3', day: 'Wednesday', start: '13:00', end: '13:55', code: 'HSS', room: 'Core-I 1002', kind: 'Class' },
  { id: 's4', day: 'Thursday', start: '13:00', end: '13:55', code: 'HSS', room: 'Core-I 1002', kind: 'Class' },
  { id: 's5', day: 'Friday', start: '13:00', end: '13:55', code: 'HSS', room: 'Core-I 1002', kind: 'Class' },
  { id: 's6', day: 'Monday', start: '14:00', end: '14:55', code: 'ME3103 (B)', room: '5103', kind: 'Class' },
  { id: 's7', day: 'Tuesday', start: '14:00', end: '14:55', code: 'ME3312', room: '5102', kind: 'Class' },
  { id: 's8', day: 'Wednesday', start: '14:00', end: '14:55', code: 'EE3005', room: '5G1', kind: 'Class' },
  { id: 's9', day: 'Thursday', start: '14:00', end: '14:55', code: 'ME3103', room: '5102 / 5103', kind: 'Class' },
  { id: 's10', day: 'Friday', start: '14:00', end: '14:55', code: 'ME3104', room: '5102 / 5103', kind: 'Class' },
  { id: 's11', day: 'Monday', start: '15:00', end: '15:55', code: 'ME3312', room: '5102', kind: 'Class' },
  { id: 's12', day: 'Tuesday', start: '15:00', end: '15:55', code: 'EE3005', room: '5G1', kind: 'Class' },
  { id: 's13', day: 'Wednesday', start: '15:00', end: '15:55', code: 'ME3101', room: '5102', kind: 'Class' },
  { id: 's14', day: 'Thursday', start: '15:00', end: '15:55', code: 'MINOR', room: 'CSE L3', kind: 'Class' },
  { id: 's15', day: 'Friday', start: '15:00', end: '15:55', code: 'ME3103 (A)', room: '5102', kind: 'Class' },
  { id: 's16', day: 'Monday', start: '16:00', end: '16:55', code: 'EE3005', room: '5G1', kind: 'Class' },
  { id: 's17', day: 'Tuesday', start: '16:00', end: '16:55', code: 'ME3101', room: '5102', kind: 'Class' },
  { id: 's18', day: 'Thursday', start: '16:00', end: '16:55', code: 'ME3104', room: '5102 / 5103', kind: 'Class' },
  { id: 's19', day: 'Friday', start: '16:00', end: '16:55', code: 'ME3312', room: '5102', kind: 'Class' },
  { id: 's20', day: 'Monday', start: '17:00', end: '17:55', code: 'ME3104', room: '5102 / 5103', kind: 'Class' },
  { id: 's21', day: 'Tuesday', start: '17:00', end: '17:55', code: 'MINOR', room: 'CSE L3', kind: 'Class' },
  { id: 's22', day: 'Wednesday', start: '17:00', end: '17:55', code: 'ME3103', room: '5102 / 5103', kind: 'Class' },
  { id: 's23', day: 'Thursday', start: '17:00', end: '17:55', code: 'ME3101', room: '5102', kind: 'Class' }
];

// Initial course code mappings: confirmed mappings for clear IITG equivalences
export const DEFAULT_MAPPINGS = {
  'ME3101': 'ME 311',          // Heat Transfer
  'ME3312': 'ME 312',          // Manufacturing Technology - II
  'ME3103': 'ME 313',          // Dynamics of Machinery
  'ME3103 (A)': 'ME 313',      // Dynamics of Machinery (Section A)
  'ME3103 (B)': 'ME 313',      // Dynamics of Machinery (Section B)
  'ME3104': 'ME 314',          // Design of Machine Elements
  'EE3005': 'EE 380',          // Electrical Machines
  'HSS': 'HSS Game Theory',    // Confirmed user elective
  'ME3101L (A)': 'ME 315',     // Mechanical Eng Lab - III
  'ME3101L (B)': 'ME 315',     // Mechanical Eng Lab - III
  'MINOR': 'MINOR'             // Minor Course
};

// Helper for dynamic ISO dates
const getRelDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const DEFAULT_TOPICS = [
  {
    id: 'top-1',
    name: 'Lumped Capacitance Method & Biot Number Criteria (Bi < 0.1)',
    courseId: 'ME 311',
    createdAt: getRelDate(-4),
    lastReviewed: getRelDate(-1),
    reviewCount: 2,
    difficulty: 'medium',
    notes: 'Bi = hLc/k. Remember Lc = V/A. Valid only when internal conduction resistance is negligible compared to external convection resistance.',
    sourceCode: 'ME3101',
    nextReview: getRelDate(3),
    retentionScore: 85
  },
  {
    id: 'top-2',
    name: 'Hydrodynamic vs Thermal Boundary Layers (Prandtl Number Effect)',
    courseId: 'ME 311',
    createdAt: getRelDate(-1),
    lastReviewed: null,
    reviewCount: 0,
    difficulty: 'hard',
    notes: 'Pr = nu / alpha = kinematic viscosity / thermal diffusivity. Liquid metals Pr << 1 (thermal boundary layer grows faster). Oils Pr >> 1.',
    sourceCode: 'ME3101',
    nextReview: getRelDate(0), // due today
    retentionScore: 40
  },
  {
    id: 'top-3',
    name: "Merchant's Circle Analysis & Shear Angle Derivation",
    courseId: 'ME 312',
    createdAt: getRelDate(-3),
    lastReviewed: getRelDate(-2),
    reviewCount: 1,
    difficulty: 'hard',
    notes: 'Ernst-Merchant equation: 2phi + beta - alpha = pi/2. Relation between cutting force Fc, thrust force Ft, shear force Fs and normal Fn.',
    sourceCode: 'ME3312',
    nextReview: getRelDate(0), // due today
    retentionScore: 65
  },
  {
    id: 'top-4',
    name: 'Taylor Tool Life Equation: V * T^n = C',
    courseId: 'ME 312',
    createdAt: getRelDate(-7),
    lastReviewed: getRelDate(-3),
    reviewCount: 3,
    difficulty: 'easy',
    notes: 'Exponent n depends on tool material: HSS n=0.1-0.2, Carbides n=0.2-0.4, Ceramics n=0.4-0.6. Memorize log-log plot slope.',
    sourceCode: 'ME3312',
    nextReview: getRelDate(7),
    retentionScore: 92
  },
  {
    id: 'top-5',
    name: 'Static and Dynamic Balancing of Multi-cylinder In-line Engines',
    courseId: 'ME 313',
    createdAt: getRelDate(-5),
    lastReviewed: getRelDate(-1),
    reviewCount: 2,
    difficulty: 'hard',
    notes: 'Primary force balance (m r omega^2 cos theta) and secondary force balance (m r omega^2 cos(2 theta)/n). Star diagram method for firing order.',
    sourceCode: 'ME3103',
    nextReview: getRelDate(0), // due today
    retentionScore: 70
  },
  {
    id: 'top-6',
    name: "Critical Speed of Shafts & Dunkerley's Formula",
    courseId: 'ME 313',
    createdAt: getRelDate(-8),
    lastReviewed: getRelDate(-2),
    reviewCount: 3,
    difficulty: 'medium',
    notes: '1/omega_cr^2 = sum(1/omega_i^2). Whirling phenomenon under unbalance e and damping ratio zeta.',
    sourceCode: 'ME3103',
    nextReview: getRelDate(6),
    retentionScore: 90
  },
  {
    id: 'top-7',
    name: 'Soderberg, Goodman, and Gerber Fatigue Failure Criteria',
    courseId: 'ME 314',
    createdAt: getRelDate(-6),
    lastReviewed: getRelDate(-2),
    reviewCount: 2,
    difficulty: 'medium',
    notes: 'Soderberg uses yield strength Syt. Goodman uses ultimate tensile strength Sut (conservative). Gerber parabola (more realistic for ductile materials).',
    sourceCode: 'ME3104',
    nextReview: getRelDate(1), // due tomorrow
    retentionScore: 78
  },
  {
    id: 'top-8',
    name: 'Lewis Bending Equation for Spur Gear Teeth',
    courseId: 'ME 314',
    createdAt: getRelDate(-2),
    lastReviewed: null,
    reviewCount: 0,
    difficulty: 'hard',
    notes: 'sigma_b = W_t / (b * m * Y). Lewis form factor Y depends on number of teeth and pressure angle (20 deg full depth involute).',
    sourceCode: 'ME3104',
    nextReview: getRelDate(0), // due today
    retentionScore: 45
  },
  {
    id: 'top-9',
    name: 'Torque-Slip Characteristic & Maximum Torque in 3-Phase Induction Motors',
    courseId: 'EE 380',
    createdAt: getRelDate(-7),
    lastReviewed: getRelDate(-3),
    reviewCount: 2,
    difficulty: 'medium',
    notes: 'Max torque T_max is independent of rotor resistance R2, but slip at max torque s_max is directly proportional to R2 (s_max = R2 / X2).',
    sourceCode: 'EE3005',
    nextReview: getRelDate(0), // due today
    retentionScore: 82
  },
  {
    id: 'top-10',
    name: 'Nash Equilibrium in Mixed Strategies & 2x2 Zero-Sum Games',
    courseId: 'HSS Game Theory',
    createdAt: getRelDate(-5),
    lastReviewed: getRelDate(-1),
    reviewCount: 3,
    difficulty: 'easy',
    notes: 'Best response correspondences. Minimax theorem by von Neumann. Battle of the Sexes and Matching Pennies solutions.',
    sourceCode: 'HSS',
    nextReview: getRelDate(5),
    retentionScore: 95
  }
];

export const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Revise: Hydrodynamic vs Thermal Boundary Layers (Prandtl Number)',
    courseId: 'ME 311',
    topicId: 'top-2',
    dueDate: getRelDate(0), // Today
    kind: 'Same-day',
    priority: 3, // High
    estimatedMinutes: 25,
    status: 'todo',
    createdAt: getRelDate(-1)
  },
  {
    id: 'task-2',
    title: "Derive: Merchant's Circle Force Relations (Fc, Ft, Fs, Fn)",
    courseId: 'ME 312',
    topicId: 'top-3',
    dueDate: getRelDate(0), // Today
    kind: 'Spaced review',
    priority: 3,
    estimatedMinutes: 30,
    status: 'todo',
    createdAt: getRelDate(-3)
  },
  {
    id: 'task-3',
    title: 'Solve: In-line 4-Cylinder Engine Primary & Secondary Force Balancing',
    courseId: 'ME 313',
    topicId: 'top-5',
    dueDate: getRelDate(0), // Today
    kind: 'Spaced review',
    priority: 2,
    estimatedMinutes: 25,
    status: 'todo',
    createdAt: getRelDate(-5)
  },
  {
    id: 'task-4',
    title: 'Formula recall: Lewis Bending equation & dynamic load factor Kv',
    courseId: 'ME 314',
    topicId: 'top-8',
    dueDate: getRelDate(0), // Today
    kind: 'Same-day',
    priority: 3,
    estimatedMinutes: 20,
    status: 'todo',
    createdAt: getRelDate(-2)
  },
  {
    id: 'task-5',
    title: 'Draw & explain: Induction motor torque-slip curve across 3 operating modes',
    courseId: 'EE 380',
    topicId: 'top-9',
    dueDate: getRelDate(-1), // Overdue by 1 day
    kind: 'Spaced review',
    priority: 2,
    estimatedMinutes: 20,
    status: 'todo',
    createdAt: getRelDate(-7)
  },
  {
    id: 'task-6',
    title: 'Flashcard review: Lumped capacitance criteria & Biot number derivation',
    courseId: 'ME 311',
    topicId: 'top-1',
    dueDate: getRelDate(-2), // Completed 2 days ago
    kind: 'Spaced review',
    priority: 2,
    estimatedMinutes: 15,
    status: 'done',
    completedAt: getRelDate(-1),
    createdAt: getRelDate(-4)
  },
  {
    id: 'task-7',
    title: 'Practice: Taylor tool life numerical with 2 cutting speeds',
    courseId: 'ME 312',
    topicId: 'top-4',
    dueDate: getRelDate(-1),
    kind: 'Practice',
    priority: 1,
    estimatedMinutes: 25,
    status: 'done',
    completedAt: getRelDate(0), // completed today!
    createdAt: getRelDate(-3)
  },
  {
    id: 'task-8',
    title: 'Review: Mixed strategy payoff matrix for 2x2 security dilemmas',
    courseId: 'HSS Game Theory',
    topicId: 'top-10',
    dueDate: getRelDate(-1),
    kind: 'Spaced review',
    priority: 1,
    estimatedMinutes: 20,
    status: 'done',
    completedAt: getRelDate(0), // completed today!
    createdAt: getRelDate(-2)
  },
  {
    id: 'task-9',
    title: 'Practice: Soderberg & Modified Goodman design line for fatigue shaft',
    courseId: 'ME 314',
    topicId: 'top-7',
    dueDate: getRelDate(1), // Tomorrow
    kind: 'Spaced review',
    priority: 2,
    estimatedMinutes: 30,
    status: 'todo',
    createdAt: getRelDate(-6)
  },
  {
    id: 'task-10',
    title: "Derive: Dunkerley's critical speed formula for multi-rotor shaft",
    courseId: 'ME 313',
    topicId: 'top-6',
    dueDate: getRelDate(3), // In 3 days
    kind: 'Spaced review',
    priority: 2,
    estimatedMinutes: 25,
    status: 'todo',
    createdAt: getRelDate(-8)
  }
];

export const DEFAULT_CLASS_LOG = [
  {
    id: 'log-1',
    date: getRelDate(-1),
    slotId: 's17',
    code: 'ME3101',
    topic: 'Hydrodynamic vs Thermal Boundary Layers (Prandtl Number Effect)',
    attended: true,
    notes: 'Covered flat plate laminar boundary layer equations and similarity solution.'
  },
  {
    id: 'log-2',
    date: getRelDate(-2),
    slotId: 's20',
    code: 'ME3104',
    topic: 'Lewis Bending Equation for Spur Gear Teeth',
    attended: true,
    notes: 'Introduced tooth form factor and dynamic load consideration.'
  },
  {
    id: 'log-3',
    date: getRelDate(-3),
    slotId: 's11',
    code: 'ME3312',
    topic: "Merchant's Circle Analysis & Shear Angle Derivation",
    attended: true,
    notes: 'Solved two numericals on cutting force components.'
  }
];

export const DEFAULT_SETTINGS = {
  reviewDays: [1, 3, 7, 14, 30],
  dailyTarget: 4,
  semester: 'Autumn 2026',
  studentName: 'Mechanical Engineering Student',
  institute: 'IIT Guwahati'
};

// Seed assessments for every course per EXAM_TRACKER.md
// Rule: Never invent dates or marks. Blank fields indicate unannounced/not entered.
const SEED_ASSESSMENT_TYPES = ['Quiz 1', 'Midsem', 'Quiz 2', 'Endsem'];

export const DEFAULT_ASSESSMENTS = DEFAULT_COURSES.flatMap(course => 
  SEED_ASSESSMENT_TYPES.map(type => ({
    id: `asm-${course.id.replace(/[^a-zA-Z0-9]/g, '_')}-${type.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    courseId: course.id,
    title: `${type}`,
    type: type,
    scheduledAt: null,       // Date & time nullable until announced
    status: 'tentative',     // tentative | confirmed | completed | postponed | cancelled
    marksObtained: null,     // Nullable numeric value
    maxMarks: null,          // Nullable numeric value
    weightagePercent: null,  // Optional percentage 0-100
    extraCredit: false,
    syllabus: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
);

export const DEFAULT_HOLIDAYS = [
  { id: 'hol-1', date: '2026-10-02', label: 'Gandhi Jayanti', isRange: false },
  { id: 'hol-2', date: '2026-10-20', label: 'Dussehra / Puja Vacation', isRange: false },
  { id: 'hol-3', date: '2026-11-09', label: 'Diwali', isRange: false }
];

