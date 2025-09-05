'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  StudyMaterial,
  StudyFolder,
  StudySession,
  StudyNote,
  Flashcard,
  FlashcardDeck,
  StudySchedule,
  StudyGoal,
  StudyStats,
  SearchFilters,
} from '@/types';

interface AppDataContextType {
  // Materials
  materials: StudyMaterial[];
  folders: StudyFolder[];
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => Promise<string>;
  updateMaterial: (id: string, updates: Partial<StudyMaterial>) => void;
  deleteMaterial: (id: string) => Promise<void>;
  
  // Folders
  addFolder: (folder: Omit<StudyFolder, 'id' | 'createdAt' | 'materialCount'>) => string;
  updateFolder: (id: string, updates: Partial<StudyFolder>) => void;
  deleteFolder: (id: string) => void;
  
  // Sessions
  sessions: StudySession[];
  addSession: (session: Omit<StudySession, 'id'>) => string;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  deleteSession: (id: string) => void;
  
  // Notes
  notes: StudyNote[];
  addNote: (note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<StudyNote>) => void;
  deleteNote: (id: string) => void;
  
  // Flashcards
  decks: FlashcardDeck[];
  addDeck: (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>) => string;
  updateDeck: (id: string, updates: Partial<FlashcardDeck>) => void;
  deleteDeck: (id: string) => void;
  addCardToDeck: (deckId: string, card: Omit<Flashcard, 'id' | 'deckId'>) => string;
  updateCard: (cardId: string, updates: Partial<Flashcard>) => void;
  deleteCard: (cardId: string) => void;
  
  // Schedule
  schedules: StudySchedule[];
  addSchedule: (schedule: Omit<StudySchedule, 'id'>) => string;
  updateSchedule: (id: string, updates: Partial<StudySchedule>) => void;
  deleteSchedule: (id: string) => void;
  
  // Goals
  goals: StudyGoal[];
  addGoal: (goal: Omit<StudyGoal, 'id' | 'createdAt'>) => string;
  updateGoal: (id: string, updates: Partial<StudyGoal>) => void;
  deleteGoal: (id: string) => void;
  
  // Search and filters
  searchResults: StudyMaterial[];
  searchMaterials: (filters: SearchFilters) => void;
  
  // Statistics
  getStats: () => StudyStats;
  
  // Data management
  exportData: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [folders, setFolders] = useState<StudyFolder[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [searchResults, setSearchResults] = useState<StudyMaterial[]>([]);

  // Load data from database on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [materialsRes, notesRes, decksRes, goalsRes] = await Promise.all([
        fetch('/api/materials', { credentials: 'include' }),
        fetch('/api/notes', { credentials: 'include' }),
        fetch('/api/flashcards', { credentials: 'include' }),
        fetch('/api/goals', { credentials: 'include' })
      ]);

      if (materialsRes.ok) {
        const data = await materialsRes.json();
        setMaterials(data.materials || []);
      }
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }
      if (decksRes.ok) {
        const data = await decksRes.json();
        setDecks(data.decks || []);
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Remove localStorage saving - data is now handled by the server

  // Material functions
  const addMaterial = async (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(material)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(prev => [...prev, data.material]);
        return data.material.id;
      }
      throw new Error('Failed to add material');
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  };

  const updateMaterial = (id: string, updates: Partial<StudyMaterial>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMaterial = async (id: string) => {
    try {
      const response = await fetch(`/api/materials?materialId=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id));
        // Also remove from notes if they reference this material
        setNotes(prev => prev.filter(n => n.materialId !== id));
      } else {
        throw new Error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  };

  // Folder functions
  const addFolder = (folder: Omit<StudyFolder, 'id' | 'createdAt' | 'materialCount'>) => {
    const id = uuidv4();
    const newFolder: StudyFolder = {
      ...folder,
      id,
      createdAt: new Date(),
      materialCount: 0,
    };
    setFolders(prev => [...prev, newFolder]);
    return id;
  };

  const updateFolder = (id: string, updates: Partial<StudyFolder>) => {
    setFolders(prev => prev.map(f => {
      if (f.id === id) {
        const materialCount = materials.filter(m => m.folderId === id).length;
        return { ...f, ...updates, materialCount };
      }
      return f;
    }));
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Move materials out of deleted folder
    setMaterials(prev => prev.map(m => 
      m.folderId === id ? { ...m, folderId: undefined } : m
    ));
  };

  // Session functions
  const addSession = (session: Omit<StudySession, 'id'>) => {
    const id = uuidv4();
    const newSession: StudySession = { ...session, id };
    setSessions(prev => [...prev, newSession]);
    return id;
  };

  const updateSession = (id: string, updates: Partial<StudySession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Note functions
  const addNote = (note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = uuidv4();
    const now = new Date();
    const newNote: StudyNote = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [...prev, newNote]);
    return id;
  };

  const updateNote = (id: string, updates: Partial<StudyNote>) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Flashcard functions
  const addDeck = (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>) => {
    const id = uuidv4();
    const newDeck: FlashcardDeck = {
      ...deck,
      id,
      createdAt: new Date(),
      cards: [],
    };
    setDecks(prev => [...prev, newDeck]);
    return id;
  };

  const updateDeck = (id: string, updates: Partial<FlashcardDeck>) => {
    setDecks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
  };

  const addCardToDeck = (deckId: string, card: Omit<Flashcard, 'id' | 'deckId'>) => {
    const cardId = uuidv4();
    const newCard: Flashcard = {
      ...card,
      id: cardId,
      deckId,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    };
    
    setDecks(prev => prev.map(d => 
      d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
    ));
    
    return cardId;
  };

  const updateCard = (cardId: string, updates: Partial<Flashcard>) => {
    setDecks(prev => prev.map(d => ({
      ...d,
      cards: d.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
    })));
  };

  const deleteCard = (cardId: string) => {
    setDecks(prev => prev.map(d => ({
      ...d,
      cards: d.cards.filter(c => c.id !== cardId)
    })));
  };

  // Schedule functions
  const addSchedule = (schedule: Omit<StudySchedule, 'id'>) => {
    const id = uuidv4();
    const newSchedule: StudySchedule = { ...schedule, id };
    setSchedules(prev => [...prev, newSchedule]);
    return id;
  };

  const updateSchedule = (id: string, updates: Partial<StudySchedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // Goal functions
  const addGoal = (goal: Omit<StudyGoal, 'id' | 'createdAt'>) => {
    const id = uuidv4();
    const newGoal: StudyGoal = {
      ...goal,
      id,
      createdAt: new Date(),
    };
    setGoals(prev => [...prev, newGoal]);
    return id;
  };

  const updateGoal = (id: string, updates: Partial<StudyGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Search function
  const searchMaterials = (filters: SearchFilters) => {
    let results = materials;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.type) {
      results = results.filter(m => m.type === filters.type);
    }

    if (filters.category) {
      results = results.filter(m => m.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(m => 
        filters.tags!.some(tag => m.tags.includes(tag))
      );
    }

    if (filters.dateRange) {
      results = results.filter(m => {
        const uploadDate = new Date(m.uploadedAt);
        return uploadDate >= filters.dateRange!.start && uploadDate <= filters.dateRange!.end;
      });
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'lastAccessed':
          const aAccessed = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
          const bAccessed = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
          comparison = aAccessed - bAccessed;
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setSearchResults(results);
  };

  // Statistics function
  const getStats = (): StudyStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalStudyTime = sessions.reduce((total, session) => total + session.duration, 0);
    const todayStudyTime = sessions
      .filter(s => new Date(s.startTime) >= today)
      .reduce((total, session) => total + session.duration, 0);
    const weekStudyTime = sessions
      .filter(s => new Date(s.startTime) >= weekAgo)
      .reduce((total, session) => total + session.duration, 0);
    const monthStudyTime = sessions
      .filter(s => new Date(s.startTime) >= monthAgo)
      .reduce((total, session) => total + session.duration, 0);

    const totalFlashcards = decks.reduce((total, deck) => total + (deck.cards?.length || 0), 0);
    const averageSessionLength = sessions.length > 0 ? totalStudyTime / sessions.length : 0;

    // Calculate study streak (consecutive days with study sessions)
    let studyStreak = 0;
    const currentDate = new Date(today);
    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      const hasSession = sessions.some(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= dayStart && sessionDate < dayEnd;
      });
      
      if (hasSession) {
        studyStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalStudyTime,
      todayStudyTime,
      weekStudyTime,
      monthStudyTime,
      totalMaterials: materials.length,
      totalNotes: notes.length,
      totalFlashcards,
      studyStreak,
      averageSessionLength,
      favoriteSubjects: [], // Would be calculated based on most studied categories
      productiveHours: [], // Would be calculated based on session times
    };
  };

  // Data management
  const exportData = () => {
    const data = {
      materials,
      folders,
      sessions,
      notes,
      decks,
      schedules,
      goals,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      setMaterials(parsedData.materials || []);
      setFolders(parsedData.folders || []);
      setSessions(parsedData.sessions || []);
      setNotes(parsedData.notes || []);
      setDecks(parsedData.decks || []);
      setSchedules(parsedData.schedules || []);
      setGoals(parsedData.goals || []);
    } catch (error) {
      throw new Error('Invalid data format');
    }
  };

  const clearAllData = () => {
    setMaterials([]);
    setFolders([]);
    setSessions([]);
    setNotes([]);
    setDecks([]);
    setSchedules([]);
    setGoals([]);
    setSearchResults([]);
  };

  const value = {
    materials,
    folders,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addFolder,
    updateFolder,
    deleteFolder,
    sessions,
    addSession,
    updateSession,
    deleteSession,
    notes,
    addNote,
    updateNote,
    deleteNote,
    decks,
    addDeck,
    updateDeck,
    deleteDeck,
    addCardToDeck,
    updateCard,
    deleteCard,
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    searchResults,
    searchMaterials,
    getStats,
    exportData,
    importData,
    clearAllData,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
