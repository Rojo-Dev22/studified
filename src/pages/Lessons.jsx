import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BookMarked, Search, FilterX, ExternalLink } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBJECT_LABELS } from '@/lib/subjects';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function Lessons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedGrade, setSelectedGrade] = useState(() => searchParams.get('grade') ? Number(searchParams.get('grade')) : null);
  const [selectedSubject, setSelectedSubject] = useState(() => searchParams.get('subject') || null);

  useEffect(() => {
    fetch('/textbooks/manifest.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.books) {
          setBooks(data.books);
        }
      })
      .catch(err => console.error('Failed to load manifest', err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGrade) params.set('grade', selectedGrade);
    if (selectedSubject) params.set('subject', selectedSubject);
    setSearchParams(params, { replace: true });
  }, [selectedGrade, selectedSubject, setSearchParams]);

  useEffect(() => {
    if (!selectedGrade) setSelectedSubject(null);
  }, [selectedGrade]);

  const availableGrades = [...new Set(books.map(b => b.grade))].sort((a, b) => a - b);
  const availableSubjects = useMemo(() => {
    if (!selectedGrade) {
      return [...new Set(books.map(b => b.subject))].sort();
    }
    return [...new Set(books.filter(b => b.grade === selectedGrade).map(b => b.subject))].sort();
  }, [books, selectedGrade]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (selectedGrade && b.grade !== selectedGrade) return false;
      if (selectedSubject && b.subject !== selectedSubject) return false;
      if (search) {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        const inTitle = b.title.toLowerCase().includes(q);
        const inSubject = b.subject.toLowerCase().includes(q);
        const inKeywords = b.keywords && b.keywords.some(k => k.toLowerCase().includes(q));
        if (!inTitle && !inSubject && !inKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [books, selectedGrade, selectedSubject, search]);

  function clearAllFilters() {
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSearch('');
  }

  const anyFilterActive = selectedGrade || selectedSubject || search;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground colors={['emerald']} orbs={2} grid={true} />
      <div className="relative z-10 p-5 md:p-8">

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 text-accent">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <BookOpen className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              MoE Textbooks
              <span className="text-lg font-normal text-muted-foreground ml-3 block sm:inline">
                Grades 9–12
              </span>
            </h1>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl">
            Browse and read all official Ministry of Education textbooks. Interactive learning materials designed for Ethiopian students.
          </p>
        </motion.div>

        <GlassCard className="px-6 py-5 backdrop-blur-xl border border-accent/20 hover:border-accent/40 transition-all duration-300 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search textbooks by subject, grade..." 
                  className="pl-12 h-11 bg-background/50 border-sidebar-border hover:border-accent/30 focus:border-accent/50 transition-colors text-base"
                />
              </div>
              <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                <Select value={selectedGrade ? String(selectedGrade) : 'all'} onValueChange={v => setSelectedGrade(v === 'all' ? null : Number(v))}>
                  <SelectTrigger className="w-full lg:w-[160px] h-11">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {availableGrades.map(g => (
                      <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubject || 'all'} onValueChange={v => setSelectedSubject(v === 'all' ? null : v)}>
                  <SelectTrigger className="w-full lg:w-[180px] h-11">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map(s => (
                      <SelectItem key={s} value={s}>{SUBJECT_LABELS[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {anyFilterActive && (
              <motion.div 
                className="mt-4 flex justify-end"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <button 
                  onClick={clearAllFilters} 
                  className="text-sm text-accent hover:text-accent/80 hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <FilterX className="w-4 h-4" /> Clear filters
                </button>
              </motion.div>
            )}
          </motion.div>
        </GlassCard>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence>
            {filteredBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <GlassCard className="h-full flex flex-col p-6 hover:border-accent/60 hover:bg-accent/5 transition-all duration-300 group cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1.5 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider group-hover:bg-accent/25 transition-colors">
                        Grade {book.grade}
                      </span>
                      <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5 font-medium">
                        <BookMarked className="w-4 h-4" />
                        {book.language.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug group-hover:text-accent transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                      {SUBJECT_LABELS[book.subject] || book.subject}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-sidebar-border/30 group-hover:border-accent/20 transition-colors">
                    <motion.a
                      href={book.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-sidebar-accent/20 to-accent/10 hover:from-accent/20 hover:to-accent/15 text-sidebar-foreground hover:text-accent transition-all duration-200 text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read PDF
                    </motion.a>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
            {filteredBooks.length === 0 && (
              <motion.div 
                className="col-span-full py-16 text-center text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No textbooks found matching your criteria.</p>
                <p className="text-sm opacity-70 mt-1">Try adjusting your filters or search terms</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
