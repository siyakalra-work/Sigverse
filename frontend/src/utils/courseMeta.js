const CATEGORY_RULES = [
  { category: 'Java & Spring', keywords: ['java', 'spring'] },
  { category: 'Node.js & API Architecture', keywords: ['node', 'api', 'service architecture'] },
  { category: 'Databases & Data Systems', keywords: ['mysql', 'mongo', 'database', 'data modeling', 'querying', 'event tracking'] },
  { category: 'React & Frontend Engineering', keywords: ['react', 'frontend', 'ui', 'performance'] },
  { category: 'UX Design & Accessibility', keywords: ['ux', 'design', 'accessibility', 'information architecture'] },
  { category: 'Testing & Quality Engineering', keywords: ['testing', 'quality', 'test'] },
  { category: 'Security & Authentication', keywords: ['security', 'authentication', 'auth'] },
  { category: 'Product Analytics & Discovery', keywords: ['analytics', 'product', 'discovery', 'roadmapping', 'metrics', 'visualization', 'search'] },
  { category: 'DevOps, Cloud & Observability', keywords: ['cloud', 'observability', 'incident', 'release', 'operations'] },
  { category: 'Delivery, Leadership & Collaboration', keywords: ['leadership', 'agile', 'delivery', 'review', 'communication', 'collaborative'] },
  { category: 'Developer Experience & Support', keywords: ['developer experience', 'support', 'knowledge base'] },
  { category: 'AI & Automation', keywords: ['ai'] }
];

const SAMPLE_VIDEOS = [
  { id: 'sample-1', title: 'Learning How to Learn', youtubeId: 'vd2dtkMINIw' },
  { id: 'sample-2', title: 'How to Study Smart', youtubeId: 'IlU-zDU6aQ0' }
];

function normalize(text) {
  return String(text || '').toLowerCase();
}

export function getCourseCategory(course) {
  const haystack = normalize(`${course?.title || ''} ${course?.description || ''}`);

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }

  return 'General';
}

export function getCourseCategories(courses) {
  const matchedCategories = (courses || []).map(getCourseCategory);
  const catalogCategories = CATEGORY_RULES.map((rule) => rule.category);
  return ['All Categories', ...Array.from(new Set([...catalogCategories, ...matchedCategories, 'General']))];
}

export function getRecommendedVideos(course, moduleItem) {
  return SAMPLE_VIDEOS;
}

function buildOptions(correct, pool) {
  const options = [correct];
  for (const item of pool) {
    if (options.length >= 4) break;
    if (item && !options.includes(item)) {
      options.push(item);
    }
  }
  while (options.length < 4) {
    options.push(`Key concept ${options.length}`);
  }
  return options;
}

export function buildSampleQuiz(moduleItem) {
  if (!moduleItem) {
    return { title: 'Module Quiz', questions: [] };
  }

  const lessons = moduleItem.lessons || [];
  const lessonTopics = lessons.map((lesson) => lesson.lesson_name || 'this lesson');
  const questions = lessonTopics.slice(0, 3).map((topic, index) => ({
    id: `sample-${moduleItem.id}-${index}`,
    prompt: `Which lesson focuses on \"${topic}\"?`,
    options: buildOptions(topic, lessonTopics),
    answer: topic
  }));

  if (questions.length === 0) {
    questions.push({
      id: `sample-${moduleItem.id}-fallback`,
      prompt: `What is the primary focus of the module \"${moduleItem.module_name || 'this module'}\"?`,
      options: buildOptions(moduleItem.module_name || 'Module overview', ['Planning', 'Delivery', 'Review']),
      answer: moduleItem.module_name || 'Module overview'
    });
  }

  return {
    title: `${moduleItem.module_name || 'Module'} Quiz`,
    questions
  };
}
