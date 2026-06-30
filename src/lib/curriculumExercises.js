/**
 * Verified in-app exercises for Ethiopian curriculum assignments & challenges.
 * Completion requires passing the exercise quiz (not honor checkboxes).
 */

const LABELS = ['a', 'b', 'c', 'd'];

function q(id, text, options, correctIndex) {
  return {
    id,
    text,
    options: options.map((t, i) => ({ id: LABELS[i], text: t })),
    correct: [LABELS[correctIndex]],
    multiSelect: false,
  };
}

const EXERCISES = {
  'eth-g9-hist-u2-d1': [
    q('e1', 'In which year did the Battle of Adwa take place?', ['1884', '1896', '1935', '1974'], 1),
    q('e2', 'Adwa is taught in Ethiopian schools mainly because it showed:', ['Foreign rule was accepted', 'Ethiopia defended sovereignty against colonization', 'Italy permanently ruled Ethiopia', 'The Berlin Conference divided Ethiopia'], 1),
    q('e3', 'Which leader is most associated with mobilization before Adwa?', ['Haile Selassie', 'Menelik II', 'Tewodros II only', 'None — only foreign generals'], 1),
    q('e4', 'A key curriculum outcome for Unit 2 is understanding:', ['Only European history', 'Ethiopian resistance to colonialism', 'Space exploration', 'Organic chemistry'], 1),
  ],
  'eth-g9-geo-u1-d1': [
    q('e1', 'Ethiopia is located in which region of Africa?', ['North-West only', 'Horn of Africa / East Africa', 'Southern Africa only', 'Central America'], 1),
    q('e2', 'The Great Rift Valley in Ethiopia affects:', ['Only ocean tides', 'Landforms, lakes, and settlement patterns', 'Only polar climate', 'Moon phases'], 1),
    q('e3', 'Highland areas in Ethiopia generally have:', ['No rainfall ever', 'Cooler temperatures than lowlands at similar latitude', 'Identical climate to deserts', 'No agriculture'], 1),
    q('e4', 'On a map skills task you should label:', ['Only one city', 'Capital, neighbours, and major physical features', 'Only rivers in Europe', 'Planet orbits'], 1),
  ],
  'eth-g9-math-u1-d1': [
    q('e1', 'Which number is rational?', ['√2', 'π', '3/4', '√5'], 2),
    q('e2', 'Real numbers include:', ['Only positive integers', 'Rational and irrational numbers', 'Only fractions less than 1', 'Only prime numbers'], 1),
    q('e3', 'In order of operations, brackets should be:', ['Ignored', 'Calculated first', 'Done last always', 'Replaced with decimals only'], 1),
    q('e4', 'Placing √2 on a number line shows it lies:', ['Between 0 and 1', 'Between 1 and 2', 'Exactly at 2', 'At 10'], 1),
  ],
  'eth-g9-bio-u1-d1': [
    q('e1', 'The first step of the scientific method is usually:', ['Publish results only', 'Observation / question', 'Skip experiments', 'Memorize without testing'], 1),
    q('e2', 'A hypothesis is:', ['A proven law always', 'A testable explanation', 'The same as a guess with no test', 'Only a graph'], 1),
    q('e3', 'Lab safety in Ethiopian schools requires:', ['Eating in the lab', 'Following teacher safety rules and wearing protection when needed', 'Running with chemicals', 'No labels on bottles'], 1),
    q('e4', 'Biology is the study of:', ['Only rocks', 'Living things and life processes', 'Only planets', 'Only machines'], 1),
  ],
  'eth-g9-amh-u1-d1': [
    q('e1', 'ንባብ (reading) skills in Amharic class focus on:', ['Only copying without understanding', 'Main idea and summary', 'Ignoring vocabulary', 'Only English grammar'], 1),
    q('e2', 'A good summary should be:', ['Longer than the passage', 'Shorter and in your own words', 'Copied word-for-word only', 'Empty'], 1),
    q('e3', 'ዋና ሃሳብ means:', ['Main idea', 'Chemical formula', 'Map scale', 'Physics force'], 0),
    q('e4', 'Vocabulary study in this unit helps you:', ['Skip exams', 'Understand passages and write clearly', 'Avoid reading', 'Ignore MoE outcomes'], 1),
  ],
  'eth-g10-math-u3-w1': [
    q('e1', 'A quadratic equation has degree:', ['1', '2', '0', '4 only'], 1),
    q('e2', 'Factoring x² − 5x + 6 gives:', ['(x−1)(x−6)', '(x−2)(x−3)', '(x+2)(x+3)', 'Cannot factor'], 1),
    q('e3', 'The graph of y = ax² + bx + c is a:', ['Straight line only', 'Parabola', 'Circle always', 'Random dots only'], 1),
    q('e4', 'For Ethiopian exit exam prep you should:', ['Only read without practice', 'Practice textbook and past questions', 'Skip word problems', 'Ignore units'], 1),
  ],
  'eth-g10-phy-u2-w1': [
    q('e1', 'Velocity differs from speed because velocity includes:', ['Mass only', 'Direction', 'Color', 'Volume'], 1),
    q('e2', 'v = u + at applies when acceleration is:', ['Always zero only', 'Constant', 'Undefined', 'Only negative always'], 1),
    q('e3', 'SI unit of acceleration is:', ['m/s', 'm/s²', 'kg', 'N only'], 1),
    q('e4', 'On a velocity–time graph, slope represents:', ['Distance directly always', 'Acceleration', 'Mass', 'Temperature'], 1),
  ],
  'eth-g10-eco-u1-w1': [
    q('e1', 'Ethiopia\'s economy is strongly linked to:', ['Only space tourism', 'Agriculture and related activities', 'No primary sector', 'Only foreign mining in Antarctica'], 1),
    q('e2', 'Primary sector includes:', ['Banking only', 'Farming, fishing, mining', 'Software only', 'Teaching only'], 1),
    q('e3', 'Scarcity means:', ['Unlimited resources', 'Limited resources vs unlimited wants', 'No choices', 'Free goods only'], 1),
    q('e4', 'Services like transport and retail belong to the:', ['Primary', 'Tertiary', 'No sector', 'Only secondary always'], 1),
  ],
  'eth-g10-chem-u2-d1': [
    q('e1', 'Protons are found in the:', ['Electron cloud only', 'Nucleus', 'Outside the atom only', 'Molecule bond only'], 1),
    q('e2', 'Atomic number Z equals number of:', ['Neutrons only', 'Protons', 'Electrons in ion only always', 'Molecules'], 1),
    q('e3', 'Isotopes have same protons but different:', ['Electrons always', 'Neutrons', 'Element name always', 'Charge always'], 1),
    q('e4', 'Periodic table groups help predict:', ['Only history dates', 'Chemical properties and trends', 'Geography capitals', 'Grammar rules'], 1),
  ],
  'eth-g10-eng-u2-d1': [
    q('e1', 'Inference in reading means:', ['Copying the passage', 'Drawing conclusions from evidence in the text', 'Ignoring the passage', 'Only spelling'], 1),
    q('e2', 'A summary should be:', ['Longer than original', 'Concise and in your words', 'Only one word', 'Unrelated'], 1),
    q('e3', 'Context clues help find:', ['Map coordinates', 'Word meaning from surrounding text', 'Chemical mass', 'Velocity'], 1),
    q('e4', 'Ethiopian English exams often use passages about:', ['Only fiction from one country', 'Development, environment, citizenship themes', 'No comprehension', 'Only mathematics'], 1),
  ],
  'eth-g11-civ-u1-s1': [
    q('e1', 'The FDRE Constitution establishes Ethiopia as:', ['A monarchy without law', 'A constitutional federal democratic republic', 'A colony of Italy', 'Without rights'], 1),
    q('e2', 'Fundamental rights in civics class include protections for:', ['Only government officials', 'Human dignity, equality before law, and freedoms listed in the constitution', 'No one', 'Only foreigners'], 1),
    q('e3', 'Civic duty may include:', ['Ignoring laws', 'Paying taxes and respecting the constitution', 'Avoiding education', 'Harming others'], 1),
    q('e4', 'Three branches of government are typically:', ['Only one branch', 'Legislative, executive, judicial', 'Only military', 'Only schools'], 1),
  ],
  'eth-g11-hist-u3-s1': [
    q('e1', 'The period after 1974 in Ethiopian history curriculum covers:', ['Only ancient Egypt', 'Major political and social change in modern Ethiopia', 'Only Adwa battle only', 'Space race only'], 1),
    q('e2', 'Source analysis asks you to check:', ['Only handwriting', 'Author, date, bias, and message', 'Only length', 'Only pictures colors'], 1),
    q('e3', 'A timeline helps you:', ['Ignore chronology', 'See order of events', 'Skip causes', 'Avoid evidence'], 1),
    q('e4', 'Essay answers should use:', ['No evidence', 'Textbook facts and clear argument', 'Only opinions without facts', 'Blank page'], 1),
  ],
  'eth-g11-math-u4-s1': [
    q('e1', 'sin θ in a right triangle equals:', ['hypotenuse/opposite', 'opposite/hypotenuse', 'adjacent/hypotenuse only always', '1 always'], 1),
    q('e2', 'Trigonometric identities are used to:', ['Skip proofs', 'Simplify expressions and prove relationships', 'Avoid angles', 'Replace algebra'], 1),
    q('e3', 'To find height of a building using angle of elevation you need:', ['Only color', 'Angle and distance (trigonometry)', 'Only time', 'Only mass'], 1),
    q('e4', 'NEAE-style math requires:', ['No working shown', 'Clear steps and correct units', 'Only guessing', 'Ignoring diagrams'], 1),
  ],
  'eth-g11-bio-u2-s1': [
    q('e1', 'Digestion mainly occurs in the:', ['Lungs', 'Alimentary canal / digestive organs', 'Bones only', 'Skin only'], 1),
    q('e2', 'A balanced diet should include:', ['One food only', 'Carbohydrates, proteins, fats, vitamins, minerals, water', 'No water', 'Only sugar'], 1),
    q('e3', 'Malnutrition can mean:', ['Only eating too much always', 'Under- or over-nutrition harming health', 'Perfect health always', 'Only exercise'], 1),
    q('e4', 'Ethiopian meal planning in class may use:', ['Only foreign foods', 'Local foods like injera, legumes, vegetables', 'No examples', 'Only drinks'], 1),
  ],
  'eth-g12-eng-u4-s1': [
    q('e1', 'An argumentative essay needs a clear:', ['Only title', 'Thesis statement', 'Random list', 'No structure'], 1),
    q('e2', 'Body paragraphs should each have:', ['No topic sentence', 'Topic sentence and supporting evidence', 'Only one word', 'Only conclusion'], 1),
    q('e3', 'Connectors (however, therefore) improve:', ['Spelling only', 'Coherence and flow', 'Handwriting', 'Margins only'], 1),
    q('e4', 'Timed exam essays require:', ['No planning', 'Brief outline then write within time', 'Infinite time', 'Only introduction'], 1),
  ],
  'eth-g12-phy-u5-s1': [
    q('e1', 'Ohm\'s law states V =', ['IR', 'I/R', 'R/I only always', 'I+R'], 0),
    q('e2', 'In series resistors, equivalent resistance:', ['Decreases', 'Increases (sum)', 'Is zero always', 'Is infinite always'], 1),
    q('e3', 'Electrical power P equals:', ['VI', 'V/I only always', 'I/R', 'R/V only'], 0),
    q('e4', 'kWh is a unit of:', ['Power only', 'Energy consumed', 'Current', 'Resistance'], 1),
  ],
  'eth-g12-eco-u3-s1': [
    q('e1', 'Economic development differs from growth because development includes:', ['Only GDP rise', 'Human well-being, structure, and quality of life', 'No change', 'Only inflation'], 1),
    q('e2', 'HDI considers health, education, and:', ['Only military size', 'Income / standard of living', 'Only geography', 'Only weather'], 1),
    q('e3', 'Agriculture in Ethiopia\'s development plan is important because:', ['It employs many people and feeds the nation', 'It does not exist', 'Only industry matters', 'Only imports matter'], 0),
    q('e4', 'Poverty reduction is a goal linked to:', ['Ignoring education', 'Growth with equity and social services', 'No policy', 'Only luxury goods'], 1),
  ],
  'eth-g9-ict-u1-d1': [
    q('e1', 'CPU is part of:', ['Output devices only', 'Processing hardware', 'Only software', 'Only network cable'], 1),
    q('e2', 'System software includes:', ['Only games always', 'Operating system', 'Only social media apps', 'Only printers'], 1),
    q('e3', 'Safe internet practice includes:', ['Sharing passwords', 'Strong passwords and not clicking unknown links', 'Posting personal data publicly', 'Ignoring updates'], 1),
    q('e4', 'Input devices include:', ['Monitor only', 'Keyboard and mouse', 'Speaker only', 'Printer output only'], 1),
  ],
  'eth-g10-bio-u2-w1': [
    q('e1', 'Plant cells differ from animal cells by having:', ['Only nucleus animal lacks', 'Cell wall and often chloroplasts', 'No membrane', 'No cytoplasm'], 1),
    q('e2', 'Mitochondria function is mainly:', ['Photosynthesis only', 'Cellular respiration / energy (ATP)', 'Protein synthesis only in nucleus', 'Cell wall building'], 1),
    q('e3', 'The nucleus controls:', ['Only movement of whole body', 'Cell activities and genetic information', 'Only digestion in stomach', 'Only blood type in heart only'], 1),
    q('e4', 'Cells are the basic unit of life because:', ['They are invisible always', 'All living organisms are made of cells', 'Only plants have cells', 'Only bacteria are cells'], 1),
  ],
  'eth-g10-hist-u2-w1': [
    q('e1', 'The Berlin Conference (1884–85) is linked to:', ['Ethiopian Adwa only', 'Partition / scramble for Africa', 'Moon landing', 'Computer invention'], 1),
    q('e2', 'Colonial economies often focused on:', ['Only local self-sufficiency always', 'Export of raw materials to Europe', 'No trade', 'Only space travel'], 1),
    q('e3', 'Ethiopia at the same period is noted for:', ['Being colonized by Britain fully', 'Maintaining independence (with Adwa symbol)', 'Not existing', 'Being part of USA'], 1),
    q('e4', 'Comparison essays should:', ['Ignore evidence', 'Use facts from textbook about two cases', 'Only opinion', 'No thesis'], 1),
  ],
  'eth-g11-geo-u2-s1': [
    q('e1', 'A population pyramid shows:', ['Only weather', 'Age and sex structure of a population', 'Chemical bonds', 'Velocity'], 1),
    q('e2', 'Rural–urban migration push factors can include:', ['Limited jobs/services in rural areas', 'Too many cities with no people', 'Only climate on Mars', 'No reasons'], 0),
    q('e3', 'Population pressure may increase demand for:', ['No resources', 'Food, water, housing, and jobs', 'Only luxury abroad only', 'Ignoring planning'], 1),
    q('e4', 'Addis Ababa is often studied as an example of:', ['Polar region', 'Urban growth and migration destination', 'Ocean floor only', 'Desert with zero people'], 1),
  ],
  'eth-g12-chem-u4-s1': [
    q('e1', 'Alkanes are:', ['Unsaturated hydrocarbons only', 'Saturated hydrocarbons (single bonds)', 'Only alcohols', 'Only acids'], 1),
    q('e2', 'Alkenes contain:', ['Only single C–C bonds', 'At least one C=C double bond', 'Only ionic bonds', 'Only metals'], 1),
    q('e3', 'Carboxylic acids contain the group:', ['−OH only in alcohol', '−COOH', '−NH₂ only', '−Cl only'], 1),
    q('e4', 'IUPAC naming in Ethiopian curriculum helps:', ['Ignore structure', 'Identify carbon chain and functional group', 'Skip organic chemistry', 'Only inorganic salts'], 1),
  ],
  // Challenges
  'eth-ch-g9-math-prep': [
    q('e1', 'Which is an irrational number?', ['1/2', '√3', '0.25', '4'], 1),
    q('e2', 'Group study for Unit 1 should focus on:', ['Only games', 'Textbook exercises and comparing methods', 'Skipping class', 'No numbers'], 1),
    q('e3', 'Classifying numbers helps before:', ['Only art class', 'Algebra units in later grades', 'Nothing', 'Only geography'], 1),
  ],
  'eth-ch-g9-hist-adwa': [
    q('e1', 'Group timeline should include:', ['Only 2024 events', '1880s–1900 key dates for Adwa era', 'Only European kings unrelated', 'Blank dates'], 1),
    q('e2', 'Presenting one leader\'s role supports:', ['Memorization without facts', 'Understanding multiple actors in Adwa', 'Ignoring curriculum', 'Only fiction'], 1),
    q('e3', 'Exam-style questions your group writes should use:', ['MoE textbook facts', 'Only movies', 'No answers', 'Random topics'], 0),
  ],
  'eth-ch-g10-phy-motion': [
    q('e1', 'When solving motion problems show:', ['No units', 'Given, formula, substitution, answer with units', 'Only answer number', 'Only drawings'], 1),
    q('e2', 'Peer marking helps find:', ['Only handwriting', 'Errors in formula or units', 'Lunch menu', 'Nothing'], 1),
    q('e3', 'Kinematics applies to:', ['Only stationary objects always', 'Objects with changing velocity', 'Only plants', 'Only history'], 1),
  ],
  'eth-ch-g10-eco-sectors': [
    q('e1', 'Ethiopian agriculture sector example is:', ['Only software export', 'Smallholder farming / coffee / livestock', 'Only banking abroad', 'No farming'], 1),
    q('e2', 'Industry sector processes:', ['Only raw crops in field', 'Raw materials into manufactured goods', 'Only services', 'Only homework'], 1),
    q('e3', 'Group poster should cite:', ['Random internet memes only', 'Textbook statistics and examples', 'No data', 'Only fiction'], 1),
  ],
  'eth-ch-g11-civ-constitution': [
    q('e1', 'Debate must use:', ['Insults only', 'Constitutional articles studied in class', 'No evidence', 'Other countries\' laws only'], 1),
    q('e2', 'Rights AND duties means citizens both:', ['Ignore the state', 'Enjoy protections and fulfill responsibilities', 'Have no responsibilities', 'Only pay no attention'], 1),
    q('e3', 'School citizenship topic should link to:', ['Only sports scores', 'Real behaviour and constitution principles', 'Nothing', 'Only movies'], 1),
  ],
  'eth-ch-g11-math-trig': [
    q('e1', 'Identity proofs need:', ['No steps', 'Logical steps from known identities', 'Only answers', 'Guessing'], 1),
    q('e2', 'Group verifies proofs on board to catch:', ['Only color', 'Algebra or trig errors', 'Lunch time', 'Nothing'], 1),
    q('e3', 'Application problems use trig for:', ['Only spelling', 'Heights, distances, angles', 'Only history dates', 'Only biology cells'], 1),
  ],
  'eth-ch-g12-eng-essay': [
    q('e1', 'Timed essay simulates:', ['No exam conditions', 'Exit exam time pressure and structure', 'Only oral exam', 'Math paper'], 1),
    q('e2', 'Peer review checks:', ['Only font size', 'Thesis, paragraph structure, grammar', 'Only title', 'Nothing'], 1),
    q('e3', 'MoE-style prompts often ask students to:', ['Ignore the question', 'Argue with reasons and examples', 'Write unrelated text', 'Leave blank'], 1),
  ],
  'eth-ch-g12-phy-circuits': [
    q('e1', 'Series circuit current is:', ['Different in each resistor always', 'Same through series components', 'Always zero', 'Random'], 1),
    q('e2', 'Ohm\'s law lab measures relationship between:', ['Mass and volume', 'Voltage and current', 'History and geography', 'Only time'], 1),
    q('e3', 'Group submits solutions to show:', ['No work', 'Collaborative problem solving with working', 'Only names', 'Blank'], 1),
  ],
  'eth-ch-g10-bio-cells': [
    q('e1', 'Chloroplast is mainly in:', ['Animal cells always', 'Plant cells', 'Bacteria only always', 'Rocks'], 1),
    q('e2', 'Group poster must label:', ['Only one organelle', 'Organelles from MoE list with functions', 'Nothing', 'Only colors'], 1),
    q('e3', 'Quizzing each other tests:', ['Only names', 'Organelle functions you must know for exams', 'Only sports', 'Ignoring book'], 1),
  ],
  'eth-ch-g12-neae-review': [
    q('e1', 'Exit exam review should mix:', ['Only one topic', 'Algebra, trigonometry, and exam-style items', 'Only vocabulary', 'Nothing'], 1),
    q('e2', 'Using official-style memo means:', ['Ignore mistakes', 'Compare working to model answers', 'Skip marking', 'Only guess'], 1),
    q('e3', '25-minute blocks help:', ['Avoid focus', 'Pace like exam sections', 'Sleep only', 'Skip study'], 1),
  ],
};

export const PASS_PERCENT = 75;

export function getExercisesForId(curriculumId) {
  return EXERCISES[curriculumId] || [];
}

export function scoreExercises(exercises, answers) {
  let correct = 0;
  exercises.forEach((ex) => {
    const sel = [...(answers[ex.id] || [])].sort().join(',');
    const key = [...ex.correct].sort().join(',');
    if (sel === key) correct += 1;
  });
  const total = exercises.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const passed = percent >= PASS_PERCENT;
  return { correct, total, percent, passed };
}

export function attachExercisesToQuest(quest) {
  const exercises = getExercisesForId(quest.curriculum_id);
  return {
    ...quest,
    content: { ...quest.content, exercises },
  };
}

export function attachExercisesToRaid(raid) {
  const exercises = getExercisesForId(raid.curriculum_id);
  return {
    ...raid,
    content: { ...raid.content, exercises },
  };
}
