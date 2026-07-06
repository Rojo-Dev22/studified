import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  Layers,
  Key,
  Send,
  Bot,
  User,
  MessageSquare,
  Sparkles,
  GraduationCap,
  ChevronRight,
  Brain,
  Lightbulb,
  Image,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import GlassCard from '../components/ui/GlassCard';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { callLLM, callLLMChat, hasLLMConfigured, saveGroqApiKey } from '@/lib/llm';
import {
  CHAT_SYSTEM,
  QUIZ_SYSTEM,
  SUMMARY_SYSTEM,
  FLASHCARDS_SYSTEM,
  quizPrompt,
  summaryPrompt,
  flashcardsPrompt,
  studyAdvicePrompt,
  parseQuizResponse,
  parseFlashcardsResponse,
  uid,
} from '@/lib/aiFormats';
import { generateQuizJSON, generateFlashcardsJSON, generateSummary } from '@/lib/aiGenerator';
import QuizArena from '@/components/ai/QuizArena';
import NoteCardDeck from '@/components/ai/NoteCardDeck';
import StudyAILoader from '../components/ai/StudyAILoader';
import { withDelayBudget } from '@/lib/aiDelay';
import { getTextbookContext } from '@/lib/textbookRetrieval';
import AnimatedBackground from '../components/ui/AnimatedBackground';

const features = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, hint: 'Ask anything about your studies', gradient: 'from-emerald-500/20 to-teal-500/10' },
  { id: 'summary', label: 'Summarize', icon: BookOpen, hint: 'Turn a topic into study notes', gradient: 'from-blue-500/20 to-cyan-500/10' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, hint: '15-question interactive quiz', gradient: 'from-amber-500/20 to-orange-500/10' },
  { id: 'flashcards', label: 'Note cards', icon: Layers, hint: 'Flip cards to memorize', gradient: 'from-purple-500/20 to-pink-500/10' },
];

const PLACEHOLDERS = {
  chat: 'Ask a question, explain a concept, or get study tips…',
  summary: 'Enter a topic or paste text to summarize…',
  quiz: 'What should I quiz you on? e.g. "Photosynthesis" or paste notes…',
  flashcards: 'Topic for note cards e.g. "World War 2 causes"…',
};

function buildHistoryForApi(messages) {
  return messages
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));
}

function FeatureButton({ f, isActive, onClick }) {
  const Icon = f.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-3 rounded-xl border text-center transition-all duration-300 overflow-hidden group ${
        isActive
          ? 'border-emerald-500/60 bg-gradient-to-br shadow-lg shadow-emerald-500/10'
          : 'border-border bg-secondary/60 hover:border-emerald-500/30 hover:bg-secondary dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10'
      } ${f.gradient}`}
    >
      {isActive && (
        <motion.div
          layoutId="activeFeature"
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className={`relative z-10 flex flex-col items-center gap-1.5`}>
        <div className={`p-2 rounded-lg transition-all duration-300 ${
          isActive 
            ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20' 
            : 'bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/80 dark:bg-white/10 dark:text-white/60 dark:group-hover:text-white/80 dark:group-hover:bg-white/15'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className={`text-xs font-semibold tracking-wide ${
          isActive ? 'text-emerald-300' : 'text-muted-foreground group-hover:text-foreground dark:text-white/60 dark:group-hover:text-white/80'
        }`}>
          {f.label}
        </p>
      </div>
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-2 right-2 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 rounded-full"
          layoutId="featureUnderline"
        />
      )}
    </motion.button>
  );
}

export default function AITools() {
  const [messages, setMessages] = useState([
    {
      id: uid(),
      role: 'assistant',
      content:
        "Hi! I'm your study assistant. Pick **Summarize**, **Quiz**, or **Note cards** above, or chat with me about anything you're learning. You can also upload images or files for me to analyze!",
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feature, setFeature] = useState('chat');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(!hasLLMConfigured());
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, activeQuizId]);

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) {
      toast.error('Paste your Groq API key first');
      return;
    }
    saveGroqApiKey(apiKeyInput.trim());
    setShowKeySetup(false);
    toast.success('API key saved for this browser');
  };

  const pushMessage = (msg) => setMessages((prev) => [...prev, { id: uid(), ...msg }]);

  const [lastQuizTopic, setLastQuizTopic] = useState('');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      id: uid(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded`);
    // Reset input so same file can be uploaded again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      id: uid(),
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
    toast.success(`${files.length} image(s) uploaded`);
    // Reset input so same file can be uploaded again
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeImage = (id) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readImageAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getStudyAdvice = async (topic, score, total, wrongQuestions) => {
    try {
      const { text } = await callLLM(studyAdvicePrompt(topic, score, total, wrongQuestions), {
        temperature: 0.5,
        max_tokens: 800,
        timeoutMs: 9000,
      });
      return text;
    } catch {
      const pct = Math.round((score / total) * 100);
      let advice = `## Focus Areas\n\n`;
      if (pct >= 80) {
        advice += `Great work! You scored ${score}/15. Review the ${wrongQuestions.length} question(s) you missed — those are the edge cases to master. Try re-reading that specific section in your textbook.`;
      } else if (pct >= 60) {
        advice += `You scored ${score}/15. You have a solid foundation but ${wrongQuestions.length} area(s) need attention. Go back to the textbook and re-read the sections covering the questions you got wrong. Then try 3 practice problems for each.`;
      } else {
        advice += `You scored ${score}/15. This topic needs stronger foundations. Start from the beginning of the chapter, define each key term, and work through the examples step by step. Then retake this quiz.`;
      }
      advice += `\n\n### Next Steps\n- Review your wrong answers above\n- Spend 25 minutes on a focused study block\n- Retake the quiz to measure improvement`;
      return advice;
    }
  };

  const prependContext = (basePrompt, context) => {
    if (!context) return basePrompt;
    return `${context}\n\n${basePrompt}`;
  };

  const runChat = async (userText, history, files = [], images = []) => {
    const apiMessages = buildHistoryForApi(history);
    
    // Add file and image context if present
    let enhancedText = userText;
    const uploadedFileNames = [];
    const uploadedImageNames = [];
    
    if (files.length > 0 || images.length > 0) {
      const fileContexts = [];
      
      for (const file of files) {
        uploadedFileNames.push(file.name);
        // Try to read text-based files
        const isTextFile = file.type && (
          file.type.includes('text') || 
          file.type.includes('json') || 
          file.type.includes('csv') ||
          file.type.includes('markdown') ||
          file.name.match(/\.(txt|md|json|csv|js|ts|py|java|cpp|c|h|xml|yaml|yml)$/i)
        );
        
        if (isTextFile) {
          try {
            const content = await readFileAsText(file.file);
            const truncatedContent = content.length > 5000 
              ? content.substring(0, 5000) + '\n\n[Content truncated due to length...]'
              : content;
            fileContexts.push(`\n\n[Uploaded file: ${file.name}]\n${truncatedContent}\n[End of file]`);
          } catch (err) {
            fileContexts.push(`\n\n[Uploaded file: ${file.name} - could not read file content]`);
          }
        } else {
          fileContexts.push(`\n\n[Uploaded file: ${file.name} - ${file.type || 'unknown type'}. Please ask questions about this file.]`);
        }
      }
      
      for (const image of images) {
        uploadedImageNames.push(image.name);
        fileContexts.push(`\n\n[Uploaded image: ${image.name} - visual content provided for analysis]`);
      }
      
      enhancedText = userText + fileContexts.join('');
      
      // CRITICAL: Update the last user message with the file content
      if (apiMessages.length > 0) {
        // Find the last user message and update it with file content
        for (let i = apiMessages.length - 1; i >= 0; i--) {
          if (apiMessages[i].role === 'user') {
            apiMessages[i] = {
              ...apiMessages[i],
              content: enhancedText
            };
            break;
          }
        }
      }
    }
    
    // Get textbook context with the enhanced text
    const context = await getTextbookContext(enhancedText);
    if (context && apiMessages.length) {
      // Find the last user message and prepend context
      for (let i = apiMessages.length - 1; i >= 0; i--) {
        if (apiMessages[i].role === 'user') {
          apiMessages[i] = {
            ...apiMessages[i],
            content: prependContext(apiMessages[i].content, context)
          };
          break;
        }
      }
    }
    
    const { text, source } = await withDelayBudget(
      callLLMChat(apiMessages, { system: CHAT_SYSTEM, max_tokens: 1200, timeoutMs: 9000 }),
      { minMs: 5000 }
    );
    
    let responseText = text;
    if (files.length > 0 || images.length > 0) {
      const hasReadableContent = files.some(f => {
        const isTextFile = f.type && (
          f.type.includes('text') || 
          f.type.includes('json') || 
          f.type.includes('csv') ||
          f.type.includes('markdown') ||
          f.name.match(/\.(txt|md|json|csv|js|ts|py|java|cpp|c|h|xml|yaml|yml)$/i)
        );
        return isTextFile;
      });
      
      if (hasReadableContent) {
        const fileList = uploadedFileNames.length > 0 ? `file(s): ${uploadedFileNames.join(', ')}` : '';
        const imageList = uploadedImageNames.length > 0 ? `image(s): ${uploadedImageNames.join(', ')}` : '';
        const combined = [fileList, imageList].filter(Boolean).join(' and ');
        responseText = `I've analyzed your ${combined}.\n\n${text}`;
      } else if (files.length > 0 && images.length === 0) {
        responseText = `I can see you've uploaded: ${uploadedFileNames.join(', ')}. However, I can only read text-based files (like .txt, .md, .json, .csv, code files). For files like .docx, .pdf, or other binary formats, please copy and paste the text content directly into the chat.\n\n${text}`;
      } else {
        const fileList = uploadedFileNames.length > 0 ? `file(s): ${uploadedFileNames.join(', ')}` : '';
        const imageList = uploadedImageNames.length > 0 ? `image(s): ${uploadedImageNames.join(', ')}` : '';
        const combined = [fileList, imageList].filter(Boolean).join(' and ');
        responseText = `I've received your ${combined}.\n\n${text}`;
      }
    }
    
    pushMessage({ role: 'assistant', content: responseText, type: 'text' });
    setUploadedFiles([]);
    setUploadedImages([]);
    if (source === 'local') toast.message('Using offline fallback — add a Groq key for full AI');
  };

  const runSummary = async (topic) => {
    const context = await getTextbookContext(topic);
    const { text, source } = await withDelayBudget(
      callLLM(prependContext(summaryPrompt(topic), context), {
        system: SUMMARY_SYSTEM,
        max_tokens: 1600,
        timeoutMs: 9000,
      }),
      { minMs: 5000 }
    );
    pushMessage({
      role: 'assistant',
      content: text,
      type: 'summary',
    });
    if (source === 'local') toast.message('Using offline fallback notes');
  };

  const runQuiz = async (topic) => {
    let quiz = null;
    try {
      const context = await getTextbookContext(topic);
      const { text, source } = await withDelayBudget(
        callLLM(prependContext(quizPrompt(topic), context), {
          system: QUIZ_SYSTEM,
          temperature: 0.4,
          max_tokens: 4000,
          timeoutMs: 15000,
        }),
        { minMs: 3000 }
      );
      quiz = parseQuizResponse(text);
      if (!quiz && source === 'local') {
        quiz = generateQuizJSON(topic);
      }
      if (!quiz) {
        const { text: retryText } = await withDelayBudget(
          callLLM(`Create a 15-question multiple choice quiz about: "${topic}". Return ONLY valid JSON with the schema: {"title":"Quiz: ...","questions":[{"id":1,"text":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correct":["a"]}]}`, {
            temperature: 0.3,
            max_tokens: 4000,
            timeoutMs: 15000,
          }),
          { minMs: 2000 }
        );
        quiz = parseQuizResponse(retryText);
      }
    } catch (err) {
      console.error('Quiz generation failed, using fallback:', err);
    }
    
    if (!quiz) {
      quiz = generateQuizJSON(topic);
    }

    setLastQuizTopic(topic);
    const msgId = uid();
    pushMessage({
      id: msgId,
      role: 'assistant',
      content: `Here's your **${quiz.title}** with ${quiz.questions.length} questions. Select your answers — results unlock when you finish all 15.`,
      type: 'quiz',
      quiz,
    });
    setActiveQuizId(msgId);
  };

  const isGenericFlashcards = (deck) => {
    const cards = deck?.cards || [];
    if (!cards.length) return true;
    const genericHits = cards.filter((c) => {
      const t = `${c.front || ''} ${c.back || ''}`.toLowerCase();
      return (
        t.includes('your topic') ||
        t.includes('any valid') ||
        t.includes('mnemonic') ||
        t.includes('review tomorrow') ||
        t.includes('study mistake') ||
        t.includes('active recall')
      );
    }).length;
    return genericHits >= Math.max(3, Math.floor(cards.length / 3));
  };

  const runFlashcards = async (topic) => {
    let deck = null;
    try {
      const context = await getTextbookContext(topic);
      const { text, source } = await withDelayBudget(
        callLLM(prependContext(flashcardsPrompt(topic), context), {
          system: FLASHCARDS_SYSTEM,
          temperature: 0.35,
          max_tokens: 1200,
          timeoutMs: 9000,
        }),
        { minMs: 5000 }
      );
      deck = parseFlashcardsResponse(text);
      if (!deck && source === 'local') {
        deck = generateFlashcardsJSON(topic);
      }
      if (deck && isGenericFlashcards(deck)) {
        deck = generateFlashcardsJSON(topic);
      }
      if (!deck) deck = generateFlashcardsJSON(topic);
    } catch {
      deck = generateFlashcardsJSON(topic);
    }

    pushMessage({
      role: 'assistant',
      content: `**${deck.title}** — ${deck.cards.length} note cards ready. Flip each card to reveal the answer.`,
      type: 'flashcards',
      deck,
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text && uploadedFiles.length === 0 && uploadedImages.length === 0) return;
    if (loading) return;

    if (!hasLLMConfigured()) {
      setShowKeySetup(true);
      toast.error('Add a free Groq API key to use AI');
      return;
    }

    // Read file contents for display
    let displayContent = text;
    const fileContents = [];
    
    for (const file of uploadedFiles) {
      const isTextFile = file.type && (
        file.type.includes('text') || 
        file.type.includes('json') || 
        file.type.includes('csv') ||
        file.type.includes('markdown') ||
        file.name.match(/\.(txt|md|json|csv|js|ts|py|java|cpp|c|h|xml|yaml|yml)$/i)
      );
      
      if (isTextFile) {
        try {
          const content = await readFileAsText(file.file);
          const truncated = content.length > 1000 ? content.substring(0, 1000) + '\n\n[Content truncated for display...]' : content;
          fileContents.push(`**${file.name}:**\n${truncated}`);
        } catch (err) {
          fileContents.push(`**${file.name}:** [Could not read file]`);
        }
      } else {
        fileContents.push(`**${file.name}:** [Binary file - ${file.type || 'unknown type'}]`);
      }
    }

    // Build the display message with file contents
    if (fileContents.length > 0) {
      displayContent = text + '\n\n' + fileContents.join('\n\n---\n\n');
    }

    const userMsg = { 
      id: uid(), 
      role: 'user', 
      content: displayContent, 
      type: 'text',
      files: uploadedFiles.map(f => f.name),
      images: uploadedImages.map(i => i.name),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    
    // Clear file inputs after sending
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    try {
      if (feature === 'chat') {
        // Capture files before clearing state
        const filesToAnalyze = [...uploadedFiles];
        const imagesToAnalyze = [...uploadedImages];
        // Pass the display content (with file contents) to runChat
        await runChat(displayContent || 'Analyze the uploaded content and answer my question', nextHistory, filesToAnalyze, imagesToAnalyze);
      } else if (feature === 'summary') {
        await runSummary(text);
      } else if (feature === 'quiz') {
        await runQuiz(text);
      } else if (feature === 'flashcards') {
        await runFlashcards(text);
      }
    } catch (err) {
      console.error(err);
      if (feature === 'summary') {
        pushMessage({
          role: 'assistant',
          content: generateSummary(text),
          type: 'summary',
        });
        toast.message('Used offline summary');
      } else if (feature === 'quiz') {
        const quiz = generateQuizJSON(text);
        const msgId = uid();
        pushMessage({
          id: msgId,
          role: 'assistant',
          content: `Offline quiz for **${text}** — 15 questions, finish all to see your score.`,
          type: 'quiz',
          quiz,
        });
        setActiveQuizId(msgId);
      } else if (feature === 'flashcards') {
        pushMessage({
          role: 'assistant',
          content: 'Offline note cards generated.',
          type: 'flashcards',
          deck: generateFlashcardsJSON(text),
        });
      } else {
        toast.error(err.message || 'Something went wrong');
        pushMessage({
          role: 'assistant',
          content: "I couldn't reach the AI right now. Check your API key or try again.",
          type: 'text',
        });
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const switchFeature = (id) => {
    setFeature(id);
    setActiveQuizId(null);
  };

  return (
    <div className="relative flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100dvh-1rem)] max-w-3xl mx-auto overflow-hidden">
      {/* Background layer */}
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-5 md:p-6 pb-3 flex-shrink-0"
        >
          {/* Title Area */}
          <div className="relative mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center"
              >
                <Brain className="w-5 h-5 text-emerald-400" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                  <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Professor Amare
                  </span>
                </h1>
                <p className="text-[11px] text-muted-foreground dark:text-white/40 font-medium tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400/60" />
                  <span>Study AI · Powered by Groq LLM</span>
                </p>
              </div>
            </div>
          </div>

          {/* API Key Setup */}
          {(showKeySetup || !hasLLMConfigured()) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <GlassCard hover={false} className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15">
                    <Key className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground dark:text-white">Unlock Full AI Power</p>
                    <p className="text-xs text-muted-foreground dark:text-white/50 mt-0.5 leading-relaxed">
                      Connect a free Groq API key to access the complete AI study experience
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="gsk_..."
                    className="bg-background border-border text-foreground text-sm h-9 placeholder:text-muted-foreground dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus:border-emerald-500/50"
                  />
                  <Button 
                    onClick={handleSaveKey} 
                    size="sm" 
                    className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25"
                  >
                    Connect
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Feature Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {features.map((f) => (
              <FeatureButton
                key={f.id}
                f={f}
                isActive={feature === f.id}
                onClick={() => switchFeature(f.id)}
              />
            ))}
          </div>
          <motion.p 
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] text-muted-foreground dark:text-white/40 mt-2.5 text-center font-medium"
          >
            {features.find((f) => f.id === feature)?.hint}
          </motion.p>
        </motion.div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 md:px-6 space-y-4 pb-4 min-h-0 scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </motion.div>

                <div className={`max-w-[85%] min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.type === 'quiz' && msg.quiz ? (
                    <div className="space-y-2">
                      {msg.content && (
                        <p className="text-xs text-muted-foreground dark:text-white/40 mb-1.5 text-left truncate">{msg.content.replace(/\*\*/g, '')}</p>
                      )}
                      <QuizArena
                        quiz={msg.quiz}
                        topic={lastQuizTopic}
                        onClose={activeQuizId === msg.id ? () => setActiveQuizId(null) : undefined}
                        onGetStudyAdvice={getStudyAdvice}
                      />
                    </div>
                  ) : msg.type === 'flashcards' && msg.deck ? (
                    <div className="space-y-2 text-left">
                      {msg.content && (
                        <p className="text-xs text-muted-foreground dark:text-white/40 mb-1.5">{msg.content.replace(/\*\*/g, '')}</p>
                      )}
                      <NoteCardDeck deck={msg.deck} />
                    </div>
                  ) : (
                    <div
                      className={`relative rounded-2xl px-4 py-3 text-sm text-left overflow-hidden ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 ml-auto inline-block shadow-lg shadow-emerald-500/5'
                          : msg.type === 'summary'
                            ? 'bg-secondary border-border backdrop-blur-sm dark:bg-white/5 dark:border-white/10'
                            : 'bg-secondary/80 border-border backdrop-blur-sm dark:bg-white/[0.04] dark:border-white/[0.06]'
                      }`}
                    >
                      {/* Subtle glow on user messages */}
                      {msg.role === 'user' && (
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />
                      )}
                      <div className="relative z-10">
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-foreground prose-strong:text-emerald-600 dark:prose-strong:text-emerald-300 prose-code:text-emerald-600 dark:prose-code:text-emerald-300 prose-a:text-emerald-600 dark:prose-a:text-emerald-400">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div>
                            <p className="whitespace-pre-wrap text-foreground dark:text-white/90">{msg.content}</p>
                            {(msg.files?.length > 0 || msg.images?.length > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {msg.files?.map((file, i) => (
                                  <span key={`file-${i}`} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {file}
                                  </span>
                                ))}
                                {msg.images?.map((img, i) => (
                                  <span key={`img-${i}`} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <Image className="w-3 h-3" />
                                    {img}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <StudyAILoader feature={feature} />
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 p-4 md:p-6 pt-3 border-t border-border bg-gradient-to-t from-background/50 to-transparent backdrop-blur-xl dark:border-white/[0.06] dark:from-black/50"
        >
          {/* Uploaded files preview */}
          {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img src={image.preview} alt={image.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative group">
            {/* Glow effect on focus */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md" />
            
            <div className="relative flex gap-2 items-end bg-background/80 border border-border rounded-2xl p-1.5 group-focus-within:border-emerald-500/40 transition-all duration-300 dark:bg-white/[0.04] dark:border-white/[0.08] dark:group-focus-within:bg-white/[0.06]">
              <div className="flex gap-1 px-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                  accept="image/*"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  title="Attach images"
                >
                  <Image className="w-4 h-4" />
                </motion.button>
              </div>
              
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDERS[feature]}
                className="bg-transparent border-0 text-sm text-foreground min-h-[44px] max-h-[120px] resize-none flex-1 px-3 py-2.5 placeholder:text-muted-foreground dark:text-white dark:placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={send}
                  disabled={loading || (!input.trim() && uploadedFiles.length === 0 && uploadedImages.length === 0)}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground dark:text-white/25 mt-2 text-center font-medium tracking-wide">
            <kbd className="px-1.5 py-0.5 rounded bg-secondary dark:bg-white/5 text-foreground dark:text-white/40 text-[9px] font-mono">Enter</kbd> to send · 
            <kbd className="px-1.5 py-0.5 rounded bg-secondary dark:bg-white/5 text-foreground dark:text-white/40 text-[9px] font-mono ml-1">Shift+Enter</kbd> new line
            {feature === 'quiz' && (
              <span className="ml-2 text-emerald-400/50">· 15 questions — answers hidden until finish</span>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}