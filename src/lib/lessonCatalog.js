/**
 * MoE Lesson Catalog
 *
 * Ethiopian General Education Curriculum — Ministry of Education.
 * Lessons are teacher-authored and strictly aligned to the MoE curriculum
 * for Grades 9–12.
 *
 * Structure: grade → subject → unit → lessons[]
 */

import { GRADES, SUBJECTS, SUBJECT_LABELS } from './subjects';

const GRADE_LABEL = (g) => `Grade ${g}`;

/**
 * Build a nested tree:
 *   { gradeId: { label, subjects: { subjectId: { label, units: { unitLabel: { lessons: [] } } } } } }
 */
function buildTree(items) {
  const tree = {};
  for (const item of items) {
    const gKey = String(item.grade);
    const sKey = item.subject;   // e.g. 'math'
    const uKey = item.unit;      // styled as "Unit N: Title"
    if (!tree[gKey]) tree[gKey] = { grade: item.grade, subjects: {} };
    if (!tree[gKey].subjects[sKey]) tree[gKey].subjects[sKey] = { subject: sKey, units: {} };
    if (!tree[gKey].subjects[sKey].units[uKey]) tree[gKey].subjects[sKey].units[uKey] = { unit: uKey, lessons: [] };
    tree[gKey].subjects[sKey].units[uKey].lessons.push(item);
  }
  // Sort units numerically by unit number
  for (const g in tree) {
    for (const s in tree[g].subjects) {
      const units = Object.values(tree[g].subjects[s].units);
      units.sort((a, b) => {
        const na = parseInt((a.unit.match(/Unit (\d+)/) || [0, 0])[1]);
        const nb = parseInt((b.unit.match(/Unit (\d+)/) || [0, 0])[1]);
        return na - nb;
      });
      tree[g].subjects[s]._sortedUnits = units;
    }
  }
  return tree;
}

/* ── Raw lesson objects ────────────────────────────────────────────────── */

function lesson({
  id,
  grade,
  subject,
  unit,
  title,
  description,
  teacher = 'MoE Curriculum Team',
  durationMinutes,
  moeReference,
  keyTerms,
  objectives,
  difficulty = 'D',
}) {
  return {
    id,
    grade,
    subject,
    unit,
    title,
    description,
    teacher,
    durationMinutes,
    moeReference,
    keyTerms: keyTerms || [],
    objectives: objectives || [],
    difficulty,
  };
}

const RAW_LESSONS = [
  /* ── Grade 9 ─────────────────────────────────────────────────────────── */
  lesson({
    id: 'g9-math-u1-l1',
    grade: 9, subject: 'math', unit: 'Unit 1: Real Numbers & Operations',
    title: 'Real Numbers on the Number Line',
    description: 'Classify numbers, place irrational numbers on a sketch number line, and practise order-of-operations.',
    teacher: 'Mr. Tesfaye Alemu (Grade 9 Math)',
    durationMinutes: 35,
    moeReference: 'Grade 9 Mathematics Student Textbook — Unit 1, Section 1.1',
    difficulty: 'D',
    keyTerms: ['natural numbers', 'integers', 'rational', 'irrational', 'number line', 'order of operations'],
    objectives: [
      'Classify a number as natural, integer, rational, or irrational.',
      'Place √2 and 3/7 on a sketch number line to 1 d.p.',
      'Apply BODMAS/PEMDAS to evaluate mixed expressions.',
    ],
  }),
  lesson({
    id: 'g9-math-u1-l2',
    grade: 9, subject: 'math', unit: 'Unit 1: Real Numbers & Operations',
    title: 'Fractions, Decimals & Percentages',
    description: 'Convert between forms, find equivalent fractions, and solve percentage word problems from the textbook.',
    teacher: 'Mr. Tesfaye Alemu (Grade 9 Math)',
    durationMinutes: 40,
    moeReference: 'Grade 9 Mathematics Student Textbook — Unit 1, Section 1.2',
    difficulty: 'D',
    keyTerms: ['fraction', 'decimal', 'percentage', 'equivalent', 'conversion'],
    objectives: [
      'Convert fractions ↔ decimals ↔ percentages without calculator.',
      'Solve 3 word problems requiring multi-step percentage logic.',
      'Use the unitary method for simple ratio problems.',
    ],
  }),
  lesson({
    id: 'g9-eng-u1-l1',
    grade: 9, subject: 'english', unit: 'Unit 1: Basic Communication Skills',
    title: 'Greetings & Introductions — Speaking Practice',
    description: 'Role-play everyday introductions and respond to simple personal questions using correct tenses.',
    teacher: 'Ms. Tigist Hailu (Grade 9 English)',
    durationMinutes: 30,
    moeReference: 'Grade 9 English Student Textbook — Unit 1, Section 1.1',
    difficulty: 'E',
    keyTerms: ['greeting', 'introduction', 'present simple', 'personal information'],
    objectives: [
      'Greet someone and introduce yourself using 5 different phrases.',
      'Ask 4 personal questions and record partner answers.',
      'Write 4 sentences about a classmate using present simple.',
    ],
  }),
  lesson({
    id: 'g9-hist-u2-l1',
    grade: 9, subject: 'history', unit: 'Unit 2: Resistance & Independence (19th–20th c.)',
    title: 'Battle of Adwa — Causes, Leaders & Outcomes',
    description: 'Analyse why Ethiopia defeated Italy at Adwa (1896) and what it meant for Pan-Africanism.',
    teacher: 'Mr. Abebe Kebede (Grade 9 History)',
    durationMinutes: 45,
    moeReference: 'Grade 9 History Student Textbook — Unit 2, Chapter 3',
    difficulty: 'D',
    keyTerms: ['Adwa', 'Menelik II', 'Empress Taytu', 'Treaty of Wuchale', 'sovereignty', 'Pan-Africanism'],
    objectives: [
      'Explain Italy\'s colonial aims after the Berlin Conference.',
      'Name key Ethiopian leaders and their specific roles in the battle.',
      'State three long-term effects of Adwa on Ethiopia and Africa.',
    ],
  }),
  lesson({
    id: 'g9-bio-u1-l1',
    grade: 9, subject: 'biology', unit: 'Unit 1: Introduction to Biology & Method',
    title: 'Scientific Method & Laboratory Safety',
    description: 'Follow the 7-step scientific method; understand lab rules and hazard symbols.',
    teacher: 'Ms. Almaz Girma (Grade 9 Biology)',
    durationMinutes: 30,
    moeReference: 'Grade 9 Biology Student Textbook — Unit 1, Section 1.1 & Practical Guide',
    difficulty: 'E',
    keyTerms: ['hypothesis', 'experiment', 'variable', 'control', 'lab safety', 'hazard symbol'],
    objectives: [
      'List the 7 steps of the scientific method.',
      'Identify 8 common lab safety rules from the MoE practical guide.',
      'Match hazard symbols (flame, corrosive, toxic) to their descriptions.',
    ],
  }),
  lesson({
    id: 'g9-geo-u1-l1',
    grade: 9, subject: 'geography', unit: 'Unit 1: Location & Physical Setting of Ethiopia',
    title: 'Ethiopian Relief Features & Climate Zones',
    description: 'Sketch the 3 major relief zones, label the Rift Valley, and connect elevation to climate.',
    teacher: 'Mr. Solomon Tilahun (Grade 9 Geography)',
    durationMinutes: 40,
    moeReference: 'Grade 9 Geography Student Textbook — Unit 1, Chapter 2',
    difficulty: 'D',
    keyTerms: ['highlands', 'lowlands', 'Rift Valley', 'escarpment', 'Köppen climate', 'altitude'],
    objectives: [
      'Draw a sketch map showing the 3 relief zones.',
      'Label the Blue Nile, Awash River, and main mountain peaks.',
      'Explain how altitude influences rainfall distribution in Ethiopia.',
    ],
  }),
  lesson({
    id: 'g9-amh-u1-l1',
    grade: 9, subject: 'amharic', unit: 'Unit 1: ንባብ እና ጽሑፍ (Reading & Writing)',
    title: 'ዋና ሃሳብ ማወቅ እና ማጠቃለል',
    description: 'Identify the main idea of a prose passage; write a 5-sentence summary in Amharic.',
    teacher: 'አቶ ተስፋይ ዳንኤል (Grade 9 Amharic)',
    durationMinutes: 35,
    moeReference: 'Grade 9 Amharic Student Textbook — Unit 1, Section 1.3',
    difficulty: 'D',
    keyTerms: ['ዋና ሃሳብ', 'ማጠቃለል', 'ንባብ', 'ጽሑፍ', 'ቃላት ማስታወሻ'],
    objectives: [
      'Highlight the main idea in a given passage.',
      'Write a summary of 4–5 sentences in Amharic.',
      'Use at least 6 new vocabulary words from the unit correctly.',
    ],
  }),
  lesson({
    id: 'g9-civ-u1-l1',
    grade: 9, subject: 'civics', unit: 'Unit 1: Citizenship & Democratic Values',
    title: 'Rights & Responsibilities of Ethiopian Citizens',
    description: 'Study fundamental rights in the FDRE Constitution and match each with a civic duty.',
    teacher: 'Mr. Gedion Assefa (Grade 9 Civics)',
    durationMinutes: 35,
    moeReference: 'Grade 9 Civics & Ethical Education — Unit 1, Section 1.1 & 1.2',
    difficulty: 'D',
    keyTerms: ['ህጋዊ መብት', 'ግዴታ', 'ፌዴሬሽን', 'ሳንተ ሃላፊነት', 'ሰብአዊ መብት'],
    objectives: [
      'List 5 fundamental rights from the FDRE Constitution studied in class.',
      'State 3 corresponding civic duties.',
      'Write 1 example of how a student can practise each duty.',
    ],
  }),
  lesson({
    id: 'g9-physics-u1-l1',
    grade: 9, subject: 'physics', unit: 'Unit 1: Introduction to Physics & Measurement',
    title: 'SI Units & Scientific Notation',
    description: 'Convert units using SI prefixes; read and write numbers in standard form.',
    teacher: 'Mr. Yohannes Getachew (Grade 9 Physics)',
    durationMinutes: 35,
    moeReference: 'Grade 9 Physics Student Textbook — Unit 1, Section 1.1',
    difficulty: 'D',
    keyTerms: ['SI unit', 'prefix', 'scientific notation', 'significant figures', 'conversion'],
    objectives: [
      'Convert g → kg and cm → m using SI prefixes.',
      'Write 0.00034 in scientific notation.',
      'State rules for significant figures when multiplying.',
    ],
  }),
  lesson({
    id: 'g9-chem-u1-l1',
    grade: 9, subject: 'chemistry', unit: 'Unit 1: States of Matter & Separation',
    title: 'States of Matter & Mixture Separation',
    description: 'Identify solids, liquids, gases by properties; explain the method for each separation technique.',
    teacher: 'Ms. Bethlehem Getu (Grade 9 Chemistry)',
    durationMinutes: 35,
    moeReference: 'Grade 9 Chemistry Student Textbook — Unit 1, Sections 1.1–1.3',
    difficulty: 'E',
    keyTerms: ['solid', 'liquid', 'gas', 'filtration', 'distillation', 'crystallisation', 'mixture'],
    objectives: [
      'Name 3 distinguishing properties for each state of matter.',
      'Explain why filtration separates sand from water.',
      'Link a separation method to one real-life Ethiopian example.',
    ],
  }),
  lesson({
    id: 'g9-ict-u1-l1',
    grade: 9, subject: 'ict', unit: 'Unit 1: Computer Systems & Digital Literacy',
    title: 'Hardware, Software & Safe Internet Use',
    description: 'Identify hardware components, distinguish system vs application software, list 5 cybersecurity practices.',
    teacher: 'Mr. Dawit Zewdu (Grade 9 ICT)',
    durationMinutes: 30,
    moeReference: 'Grade 9 ICT Student Textbook — Unit 1, Sections 1.1 & 1.2',
    difficulty: 'E',
    keyTerms: ['CPU', 'RAM', 'hardware', 'software', 'operating system', 'cybersecurity', 'phishing'],
    objectives: [
      'Name input, output, storage, and processing devices.',
      'Distinguish system software from application software.',
      'List 5 safe internet practices from the textbook.',
    ],
  }),

  /* ── Grade 10 ────────────────────────────────────────────────────────── */
  lesson({
    id: 'g10-math-u3-l1',
    grade: 10, subject: 'math', unit: 'Unit 3: Quadratic Equations & Functions',
    title: 'Solving Quadratics by Factoring',
    description: 'Factor ax²+bx+c, find roots, and sketch basic parabolas from vertex form.',
    teacher: 'Mr. Tesfaye Alemu (Grade 10 Math)',
    durationMinutes: 45,
    moeReference: 'Grade 10 Mathematics Student Textbook — Unit 3, Section 3.1',
    difficulty: 'C',
    keyTerms: ['quadratic', 'factor', 'root', 'parabola', 'vertex', 'axis of symmetry'],
    objectives: [
      'Factor ax²+bx+c into (px+q)(rx+s) where possible.',
      'Solve the quadratic by setting each factor to zero.',
      'Sketch y = a(x-h)²+k and state vertex coordinates.',
    ],
  }),
  lesson({
    id: 'g10-physics-u2-l1',
    grade: 10, subject: 'physics', unit: 'Unit 2: Motion in One Dimension',
    title: 'Speed, Velocity & Acceleration Calculations',
    description: 'Use SI kinematics equations; sketch and interpret distance–time / velocity–time graphs.',
    teacher: 'Mr. Yohannes Getachew (Grade 10 Physics)',
    durationMinutes: 50,
    moeReference: 'Grade 10 Physics Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'C',
    keyTerms: ['speed', 'velocity', 'acceleration', 'kinematics', 'distance–time graph', 'v = u + at'],
    objectives: [
      'Distinguish speed (scalar) from velocity (vector).',
      'Use v = u + at and s = ut + ½at² for constant-acceleration motion.',
      'Calculate acceleration from a velocity–time graph slope.',
    ],
  }),
  lesson({
    id: 'g10-biology-u2-l1',
    grade: 10, subject: 'biology', unit: 'Unit 2: Cell Structure & Function',
    title: 'Plant & Animal Cell Organelles',
    description: 'Draw labelled diagrams; match organelles to functions; identify shared vs unique structures.',
    teacher: 'Ms. Almaz Girma (Grade 10 Biology)',
    durationMinutes: 45,
    moeReference: 'Grade 10 Biology Student Textbook — Unit 2, Sections 2.1–2.2 & Lab Manual',
    difficulty: 'C',
    keyTerms: ['cell membrane', 'nucleus', 'mitochondria', 'chloroplast', 'cell wall', 'ribosome', 'vacuole'],
    objectives: [
      'Draw and label a plant cell and an animal cell in separate diagrams.',
      'Match each organelle to its primary function.',
      'List 3 structures found in plant cells but not animal cells.',
    ],
  }),
  lesson({
    id: 'g10-history-u2-l1',
    grade: 10, subject: 'history', unit: 'Unit 2: Africa & Colonialism',
    title: 'Berlin Conference 1884–85 & the Partition of Africa',
    description: 'Explain causes and outcomes of the Berlin Conference; contrast Ethiopian independence with nearby colonised states.',
    teacher: 'Mr. Abebe Kebede (Grade 10 History)',
    durationMinutes: 50,
    moeReference: 'Grade 10 History Student Textbook — Unit 2, Chapter 1',
    difficulty: 'C',
    keyTerms: ['Berlin Conference', 'partition', 'scramble for Africa', 'colonialism', 'sovereignty', 'independence'],
    objectives: [
      'List 5 motives behind European colonisation of Africa.',
      'Draw a labelled map of colonising powers in Africa, 1914.',
      'Write a comparison paragraph on Ethiopia vs one colonised neighbour.',
    ],
  }),
  lesson({
    id: 'g10-chemistry-u2-l1',
    grade: 10, subject: 'chemistry', unit: 'Unit 2: Atomic Structure & Periodic Table',
    title: 'Subatomic Particles, Isotopes & Periodic Table Trends',
    description: 'Proton/neutron/electron properties; define isotope; read atomic number and mass from periodic table.',
    teacher: 'Ms. Bethlehem Getu (Grade 10 Chemistry)',
    durationMinutes: 40,
    moeReference: 'Grade 10 Chemistry Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'C',
    keyTerms: ['proton', 'neutron', 'electron', 'isotope', 'atomic number', 'mass number', 'periodic table'],
    objectives: [
      'Name the charge and location of each subatomic particle.',
      'Define isotope and write an example using standard notation.',
      'Read atomic number Z and relative atomic mass A from the periodic table.',
    ],
  }),
  lesson({
    id: 'g10-economics-u1-l1',
    grade: 10, subject: 'economics', unit: 'Unit 1: Introduction to Economics & Ethiopian Economy',
    title: 'Primary, Secondary & Tertiary Sectors',
    description: 'Define economic sectors and use Ethiopian data from the textbook to classify activities.',
    teacher: 'Mr. Berhanu Mulugeta (Grade 10 Economics)',
    durationMinutes: 40,
    moeReference: 'Grade 10 Economics Student Textbook — Unit 1, Sections 1.1–1.2',
    difficulty: 'D',
    keyTerms: ['primary sector', 'secondary sector', 'tertiary sector', 'agriculture', 'manufacturing', 'services', 'scarcity'],
    objectives: [
      'Define primary, secondary, and tertiary sectors.',
      'Give two genuine Ethiopian examples for each sector.',
      'State the share of agriculture in employment using textbook statistics.',
    ],
  }),
  lesson({
    id: 'g10-eng-u2-l1',
    grade: 10, subject: 'english', unit: 'Unit 2: Reading Comprehension & Summary',
    title: 'Inference Questions & 80-Word Summary',
    description: 'Read a MoE textbook passage; answer inference questions; write a summary in ≤80 words.',
    teacher: 'Ms. Tigist Hailu (Grade 10 English)',
    durationMinutes: 40,
    moeReference: 'Grade 10 English Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'D',
    keyTerms: ['inference', 'summary', 'context clue', 'vocabulary', 'paragraph'],
    objectives: [
      'Answer 4 inference questions without copying full sentences.',
      'Write a summary of the passage in ≤80 words.',
      'Identify 8 vocabulary words using context clues from the passage.',
    ],
  }),
  lesson({
    id: 'g10-amh-u1-l1',
    grade: 10, subject: 'amharic', unit: 'Unit 1: ንባብ እና ጽሑፍ (Reading & Writing)',
    title: 'ቋንቋ ስነምግባር — Dictation & Paragraph Writing',
    description: 'Precision spelling dictation followed by structured paragraph writing on a given topic.',
    teacher: 'አቶ ተስፋይ ዳንኤል (Grade 10 Amharic)',
    durationMinutes: 35,
    moeReference: 'Grade 10 Amharic Student Textbook — Unit 1, Sections 1.1 & 1.2',
    difficulty: 'C',
    keyTerms: ['dictation', 'paragraph', 'topic sentence', 'ቅሱስ', 'ማደባር', 'ምሳሌ'],
    objectives: [
      'Complete a 10-line dictation with ≤3 errors.',
      'Write a paragraph with a clear topic sentence and 3 supporting sentences.',
      'Use 5 descriptive adjectives correctly in context.',
    ],
  }),

  /* ── Grade 11 ────────────────────────────────────────────────────────── */
  lesson({
    id: 'g11-civ-u1-l1',
    grade: 11, subject: 'civics', unit: 'Unit 1: Constitution & Democratic Governance',
    title: 'FDRE Constitution — Branches of Government',
    description: 'Study the three branches; evaluate how checks and balances work in Ethiopia\'s federal system.',
    teacher: 'Mr. Gedion Assefa (Grade 11 Civics)',
    durationMinutes: 45,
    moeReference: 'Grade 11 Civics & Ethical Education Student Textbook — Unit 1, Section 1.3',
    difficulty: 'B',
    keyTerms: ['legislative', 'executive', 'judiciary', 'checks and balances', 'federalism', 'constitution'],
    objectives: [
      'Name the 3 branches of Ethiopian government and describe each branch\'s main function.',
      'Give one example of a check each branch has on the others.',
      'List 5 fundamental rights from the constitution chapter studied.',
    ],
  }),
  lesson({
    id: 'g11-math-u4-l1',
    grade: 11, subject: 'math', unit: 'Unit 4: Trigonometry',
    title: 'Trigonometric Ratios & Right-Triangle Applications',
    description: 'Sine, cosine, tangent in right triangles; solve heights-and-distances problems.',
    teacher: 'Mr. Tesfaye Alemu (Grade 11 Math)',
    durationMinutes: 60,
    moeReference: 'Grade 11 Mathematics Student Textbook — Unit 4, Sections 4.1 & 4.2',
    difficulty: 'A',
    keyTerms: ['sine', 'cosine', 'tangent', 'hypotenuse', 'angle of elevation', 'angle of depression', 'SOH-CAH-TOA'],
    objectives: [
      'Define sin, cos, tan ratios for acute angles in right triangles.',
      'Solve a height-of-building problem using angle of elevation.',
      'Convert angle values to trig ratios (degrees → calculator).',
    ],
  }),
  lesson({
    id: 'g11-biology-u2-l1',
    grade: 11, subject: 'biology', unit: 'Unit 2: Human Biology — Nutrition & Digestion',
    title: 'Digestive System Organs & Balanced Diet',
    description: 'Label digestive organs; explain each organ\'s role; plan a one-day nutritious Ethiopian meal.',
    teacher: 'Ms. Almaz Girma (Grade 11 Biology)',
    durationMinutes: 50,
    moeReference: 'Grade 11 Biology Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'C',
    keyTerms: ['alimentary canal', 'enzyme', 'stomach', 'small intestine', 'liver', 'balanced diet', 'malnutrition'],
    objectives: [
      'Label the human digestive system with all major organs.',
      'State the function of the pancreas and liver in digestion.',
      'Plan a one-day balanced Ethiopian meal and justify each food group included.',
    ],
  }),
  lesson({
    id: 'g11-physics-u3-l1',
    grade: 11, subject: 'physics', unit: 'Unit 3: Waves & Sound',
    title: 'Wave Properties — λ, f, v & Sound',
    description: 'Distinguish longitudinal and transverse waves; use v = fλ to solve wave questions.',
    teacher: 'Mr. Yohannes Getachew (Grade 11 Physics)',
    durationMinutes: 45,
    moeReference: 'Grade 11 Physics Student Textbook — Unit 3, Sections 3.1 & 3.2',
    difficulty: 'B',
    keyTerms: ['wave', 'wavelength', 'frequency', 'amplitude', 'transverse', 'longitudinal', 'v = fλ'],
    objectives: [
      'Sketch longitudinal and transverse waves and label λ, f, amplitude.',
      'Use v = fλ and rearrange for any variable.',
      'Word problem: calculate wavelength from given velocity and frequency.',
    ],
  }),
  lesson({
    id: 'g11-history-u3-l1',
    grade: 11, subject: 'history', unit: 'Unit 3: Ethiopia since 1974',
    title: '1974 Revolution — Causes, Events & Consequences',
    description: 'Analyse the causes of the 1974 revolution with timeline construction and source-work skills.',
    teacher: 'Mr. Abebe Kebede (Grade 11 History)',
    durationMinutes: 60,
    moeReference: 'Grade 11 History Student Textbook — Unit 3, Chapter 1',
    difficulty: 'B',
    keyTerms: ['1974 revolution', 'Derg', 'Haile Selassie', 'socialist programme', 'land reform', 'red terror'],
    objectives: [
      'List 6 socio-economic causes leading to the 1974 revolution.',
      'Create a 10-event timeline from February 1974 to mid-1978.',
      'Use source analysis to explain one poster/speech from the period.',
    ],
  }),
  lesson({
    id: 'g11-eng-u1-l1',
    grade: 11, subject: 'english', unit: 'Unit 1: Advanced Reading & Literary Analysis',
    title: 'Narrative Voice & Literary Devices',
    description: 'Identify first- vs third-person narration; define metaphor, simile, personification, and irony from the unit passage.',
    teacher: 'Ms. Tigist Hailu (Grade 11 English)',
    durationMinutes: 40,
    moeReference: 'Grade 11 English Student Textbook — Unit 1, Sections 1.1–1.4',
    difficulty: 'B',
    keyTerms: ['narrative voice', 'metaphor', 'simile', 'personification', 'irony', 'tone', 'literary device'],
    objectives: [
      'Identify the narrator in 3 given text extracts.',
      'Spot 3 different literary devices in a poem and explain each effect.',
      'Write 2 sentences in the same voice as the narration style studied.',
    ],
  }),
  lesson({
    id: 'g11-geo-u2-l1',
    grade: 11, subject: 'geography', unit: 'Unit 2: Population & Development in Ethiopia',
    title: 'Population Pyramids & Rural–Urban Migration',
    description: 'Interpret population pyramids; analyse push/pull factors; link migration to resource pressure in Ethiopian towns.',
    teacher: 'Mr. Solomon Tilahun (Grade 11 Geography)',
    durationMinutes: 50,
    moeReference: 'Grade 11 Geography Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'B',
    keyTerms: ['population pyramid', 'dependency ratio', 'rural–urban migration', 'push factor', 'pull factor', 'census', 'urbanisation'],
    objectives: [
      'Describe what a population pyramid shows and draw one from textbook data.',
      'Name 2 push and 2 pull factors for rural–urban migration in Ethiopia.',
      'Link population growth to food security and school demand in a short paragraph.',
    ],
  }),
  lesson({
    id: 'g11-economics-u2-l1',
    grade: 11, subject: 'economics', unit: 'Unit 2: Market Economics & Price',
    title: 'Supply, Demand & Price Floors',
    description: 'Draw supply and demand curves; identify equilibrium; explain effects of a price floor on Ethiopian agricultural markets.',
    teacher: 'Mr. Berhanu Mulugeta (Grade 11 Economics)',
    durationMinutes: 50,
    moeReference: 'Grade 11 Economics Student Textbook — Unit 2, Sections 2.1–2.3',
    difficulty: 'B',
    keyTerms: ['supply', 'demand', 'equilibrium', 'surplus', 'shortage', 'price floor', 'price ceiling'],
    objectives: [
      'Sketch a labelled supply and demand graph showing equilibrium.',
      'Explain effect of a price floor set above equilibrium.',
      'Give a real maize-market example from an Ethiopian region.',
    ],
  }),
  lesson({
    id: 'g11-chemistry-u3-l1',
    grade: 11, subject: 'chemistry', unit: 'Unit 3: Chemical Bonding',
    title: 'Ionic vs Covalent Bonding',
    description: 'Draw Lewis dot structures; distinguish ionic from covalent bonding; name 5 ionic and 5 covalent compounds.',
    teacher: 'Ms. Bethlehem Getu (Grade 11 Chemistry)',
    durationMinutes: 50,
    moeReference: 'Grade 11 Chemistry Student Textbook — Unit 3, Sections 3.1–3.3',
    difficulty: 'B',
    keyTerms: ['ion', 'electron', 'covalent bond', 'ionic bond', 'Lewis structure', 'metal', 'non-metal', 'molecule'],
    objectives: [
      'State the octet rule and its exceptions.',
      'Draw Lewis dot structures for NaCl, H₂O, and CO₂.',
      'List 2 properties of ionic compounds vs covalent compounds.',
    ],
  }),

  /* ── Grade 12 ────────────────────────────────────────────────────────── */
  lesson({
    id: 'g12-eng-u4-l1',
    grade: 12, subject: 'english', unit: 'Unit 4: Essay Writing for Exit Exam',
    title: 'Argumentative Essay — Structure & Timed Practice',
    description: 'Thesis statements, body paragraphs with topic sentences, and connectors — 45-minute timed exam simulation.',
    teacher: 'Ms. Tigist Hailu (Grade 12 English)',
    durationMinutes: 90,
    moeReference: 'Grade 12 English Student Textbook — Unit 4, Sections 4.1–4.3',
    difficulty: 'A',
    keyTerms: ['thesis', 'topic sentence', 'conclusion', 'counter-argument', 'connector', 'cohesion'],
    objectives: [
      'Write a thesis statement for a given prompt in 2 sentences.',
      'Draft 3 body paragraphs each with a topic sentence + evidence.',
      'Use at least 5 connectors from the MoE writing list correctly.',
    ],
  }),
  lesson({
    id: 'g12-math-u5-l1',
    grade: 12, subject: 'math', unit: 'Unit 5: Calculus — Differentiation',
    title: 'Differentiation Rules — Product, Quotient & Chain',
    description: 'Master first-principles limits; apply product, quotient, and chain rules; solve tangent/normal problems.',
    teacher: 'Mr. Tesfaye Alemu (Grade 12 Math)',
    durationMinutes: 60,
    moeReference: 'Grade 12 Mathematics Student Textbook — Unit 5, Sections 5.1–5.4',
    difficulty: 'A',
    keyTerms: ['derivative', 'differentiation', 'chain rule', 'product rule', 'quotient rule', 'tangent', 'normal', 'limit'],
    objectives: [
      'Differentiate xⁿ using the power rule for all real n.',
      'Apply the chain rule to composite functions.',
      'Find the equation of a tangent given gradient and point.',
    ],
  }),
  lesson({
    id: 'g12-physics-u5-l1',
    grade: 12, subject: 'physics', unit: 'Unit 5: Electricity & Magnetism',
    title: "Ohm's Law & DC Circuit Analysis",
    description: 'Apply V = IR; calculate series/parallel resistance; power P = VI used in kWh billing calculations.',
    teacher: 'Mr. Yohannes Getachew (Grade 12 Physics)',
    durationMinutes: 55,
    moeReference: 'Grade 12 Physics Student Textbook — Unit 5, Sections 5.1–5.3',
    difficulty: 'A',
    keyTerms: ['current', 'voltage', 'resistance', 'Ohm\'s law', 'series circuit', 'parallel circuit', 'power', 'kWh'],
    objectives: [
      'State Ohm\'s law and rearrange it for I and R.',
      'Calculate equivalent resistance for series and parallel networks.',
      'Use P = VI to find energy in kWh for a sample monthly bill.',
    ],
  }),
  lesson({
    id: 'g12-chemistry-u4-l1',
    grade: 12, subject: 'chemistry', unit: 'Unit 4: Organic Chemistry Introduction',
    title: 'Hydrocarbons — Alkanes, Alkenes & Functional Groups',
    description: 'Name simple hydrocarbons with IUPAC rules; distinguish alkanes vs alkenes; recognise functional groups.',
    teacher: 'Ms. Bethlehem Getu (Grade 12 Chemistry)',
    durationMinutes: 50,
    moeReference: 'Grade 12 Chemistry Student Textbook — Unit 4, Sections 4.1–4.3',
    difficulty: 'A',
    keyTerms: ['alkane', 'alkene', 'IUPAC naming', 'functional group', 'saturated', 'unsaturated', 'covalent bond'],
    objectives: [
      'Name alkanes up to C6H14 using IUPAC rules.',
      'Distinguish saturated (C–C single) from unsaturated (C=C double) hydrocarbons.',
      'Identify −OH (alcohol), −COOH (acid), and −NH₂ (amine) groups.',
    ],
  }),
  lesson({
    id: 'g12-biology-u4-l1',
    grade: 12, subject: 'biology', unit: 'Unit 4: Genetics — Inheritance & Variation',
    title: 'Mendelian Inheritance — Monohybrid & Dihybrid Crosses',
    description: 'Construct Punnett squares for monohybrid and dihybrid crosses; interpret phenotype ratios.',
    teacher: 'Ms. Almaz Girma (Grade 12 Biology)',
    durationMinutes: 60,
    moeReference: 'Grade 12 Biology Student Textbook — Unit 4, Sections 4.1–4.4',
    difficulty: 'A',
    keyTerms: ['gene', 'allele', 'dominant', 'recessive', 'homozygous', 'heterozygous', 'Punnett square', 'phenotype', 'genotype'],
    objectives: [
      'Draw a monohybrid cross and state F₁ and F₂ phenotype ratios.',
      'Complete a dihybrid cross Punnett square independently.',
      'Explain how sex-linked inheritance (X-linked) differs from autosomal.',
    ],
  }),
  lesson({
    id: 'g12-history-u3-l1',
    grade: 12, subject: 'history', unit: 'Unit 3: Ethiopia since 1974',
    title: '1991 Transition & the EPRDF Era',
    description: 'Analyse the fall of the Derg, the 1991 Transitional Government, the 1995 Constitution, and the federal system.',
    teacher: 'Mr. Abebe Kebede (Grade 12 History)',
    durationMinutes: 65,
    moeReference: 'Grade 12 History Student Textbook — Unit 3, Chapter 2',
    difficulty: 'A',
    keyTerms: ['EPRDF', '1991 Transition', '1995 Constitution', 'ethnic federalism', 'transitional government', 'Eritrea'],
    objectives: [
      'Outline key events May 1991–August 1995.',
      'Explain the rationale and structure of ethnic federalism in the FDRE.',
      'Analyse one primary-source excerpt from the student textbook.',
    ],
  }),
  lesson({
    id: 'g12-economics-u3-l1',
    grade: 12, subject: 'economics', unit: 'Unit 3: Development & Plan in Ethiopia',
    title: 'Economic Development vs Growth — Determinants & Indicators',
    description: 'Contrast GDP growth with HDI and sustainable development; use Ethiopian Growth and Transformation Plan data.',
    teacher: 'Mr. Berhanu Mulugeta (Grade 12 Economics)',
    durationMinutes: 55,
    moeReference: 'Grade 12 Economics Student Textbook — Unit 3, Sections 3.1–3.3',
    difficulty: 'A',
    keyTerms: ['GDP', 'GNI', 'HDI', 'development', 'growth', 'GTP', 'poverty', 'inequality'],
    objectives: [
      'Distinguish economic growth from economic development.',
      'Tabulate 3 key indicators: GDP, HDI, poverty headcount (use textbook data).',
      'Discuss whether higher GDP always means higher HDI with one Ethiopian example.',
    ],
  }),
  lesson({
    id: 'g12-physics-u4-l1',
    grade: 12, subject: 'physics', unit: 'Unit 4: Thermodynamics',
    title: 'Heat Transfer — Conduction, Convection & Radiation',
    description: 'Explain all three heat-transfer mechanisms; solve heat-capacity examples using Q = mcΔT.',
    teacher: 'Mr. Yohannes Getachew (Grade 12 Physics)',
    durationMinutes: 50,
    moeReference: 'Grade 12 Physics Student Textbook — Unit 4, Sections 4.1–4.2',
    difficulty: 'B',
    keyTerms: ['conduction', 'convection', 'radiation', 'specific heat capacity', 'temperature', 'Q = mcΔT'],
    objectives: [
      'Distinguish conduction, convection, and radiation with real Kenyan/Ethiopian examples.',
      'Use Q = mcΔT to calculate heat absorbed by water.',
      'Explain why metal feels colder than wood even at room temperature.',
    ],
  }),
  lesson({
    id: 'g12-chemistry-u1-l1',
    grade: 12, subject: 'chemistry', unit: 'Unit 1: Chemical Equilibrium',
    title: 'Le Châtelier\'s Principle — Shifts in Equilibrium',
    description: 'Predict shifts in equilibrium when concentration, pressure, or temperature is changed.',
    teacher: 'Ms. Bethlehem Getu (Grade 12 Chemistry)',
    durationMinutes: 50,
    moeReference: 'Grade 12 Chemistry Student Textbook — Unit 1, Section 1.2',
    difficulty: 'B',
    keyTerms: ['equilibrium', 'Le Châtelier', 'shift', 'concentration', 'temperature', 'pressure', 'catalyst'],
    objectives: [
      'State Le Châtelier\'s principle in one sentence.',
      'Predict the correct shift for each change: concentration increase, pressure increase, temperature increase.',
      'Distinguish the role of a catalyst (no shift) from other le Chatelier changes.',
    ],
  }),
  lesson({
    id: 'g12-biology-u1-l1',
    grade: 12, subject: 'biology', unit: 'Unit 1: Cell Division — Mitosis & Meiosis',
    title: 'Stages of Mitosis — Description & Diagram Labelling',
    description: 'Describe prophase, metaphase, anaphase, telophase; draw and label a mitosis diagram showing all 4 stages.',
    teacher: 'Ms. Almaz Girma (Grade 12 Biology)',
    durationMinutes: 55,
    moeReference: 'Grade 12 Biology Student Textbook — Unit 1, Section 1.1 & Lab Manual',
    difficulty: 'B',
    keyTerms: ['mitosis', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis', 'chromosome', 'spindle fibre'],
    objectives: [
      'Describe the key changes in each of the 4 stages of mitosis.',
      'Identify the stage from a photomicrograph or textbook diagram.',
      'State one function of mitosis in growth, repair, or asexual reproduction.',
    ],
  }),
  lesson({
    id: 'g12-civics-u2-l1',
    grade: 12, subject: 'civics', unit: 'Unit 2: Global Citizenship & International Law',
    title: 'UN, AU & Regional Organisations — Ethiopia\'s Role',
    description: 'UN, AU, IGAD mandates and Ethiopia\'s diplomatic engagement in peacekeeping and regional conflict.',
    teacher: 'Mr. Gedion Assefa (Grade 12 Civics)',
    durationMinutes: 45,
    moeReference: 'Grade 12 Civics & Ethical Education Student Textbook — Unit 2, Section 2.1–2.3',
    difficulty: 'B',
    keyTerms: ['United Nations', 'African Union', 'IGAD', 'peacekeeping', 'sovereignty', 'international law', 'human rights'],
    objectives: [
      'Name the 6 main UN organs and one main function each.',
      'State Ethiopia\'s current peacekeeping contributions (use textbook data).',
      'Explain why African countries established the AU (vs the former OAU).',
    ],
  }),
];

/* ── Derived tree ─────────────────────────────────────────────────────── */

const LESSON_TREE = buildTree(RAW_LESSONS);

/* ── Public helpers ──────────────────────────────────────────────────── */

/** Return all lesson tree nodes keyed by grade. */
export function getLessonTree() {
  return { gradeOrder: [...GRADES], tree: LESSON_TREE };
}

/** Return all lessons flattened, with optional grade/subject/unit filters. */
export function getLessons({ grade, subject, unit } = {}) {
  return RAW_LESSONS.filter((l) => {
    if (grade !== undefined && grade !== null && String(l.grade) !== String(grade)) return false;
    if (subject && l.subject !== subject) return false;
    if (unit && l.unit !== unit) return false;
    return true;
  });
}

/** Return available grade levels that contain lessons. */
export function getGradesWithLessons() {
  return Object.keys(LESSON_TREE).map(String).sort((a, b) => Number(a) - Number(b));
}

/** Return subjects available in a given grade. (subject keys array) */
export function getSubjectsForGrade(grade) {
  const g = LESSON_TREE[String(grade)];
  if (!g) return [];
  return Object.keys(g.subjects).sort();
}

/** Return units available in a given grade+subject. */
export function getUnitsForGradeSubject(grade, subject) {
  const g = LESSON_TREE[String(grade)];
  if (!g?.subjects[subject]) return [];
  return g.subjects[subject]._sortedUnits || [];
}

/** Return lessons for a given grade+subject+unit. */
export function getLessonsForUnit(grade, subject, unit) {
  return getLessons({ grade, subject, unit });
}
