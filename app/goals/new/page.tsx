// app/goals/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Calendar, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';

type GoalType = 'time' | 'materials' | 'flashcards' | 'sessions';
type GoalPriority = 'low' | 'medium' | 'high';

interface GoalForm {
  title: string;
  description: string;
  type: GoalType;
  target: string;
  unit: string;
  deadline: string;
  priority: GoalPriority;
}

const goalTypeOptions = [
  { value: 'time', label: 'Study Time', description: 'Track total study hours/minutes', defaultUnit: 'minutes' },
  { value: 'materials', label: 'Study Materials', description: 'Number of materials to review', defaultUnit: 'materials' },
  { value: 'flashcards', label: 'Flashcard Reviews', description: 'Number of flashcards to review', defaultUnit: 'cards' },
  { value: 'sessions', label: 'Study Sessions', description: 'Number of study sessions to complete', defaultUnit: 'sessions' }
];

const priorityOptions = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' }
];

export default function NewGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<GoalForm>({
    title: '',
    description: '',
    type: 'time',
    target: '',
    unit: 'minutes',
    deadline: '',
    priority: 'medium'
  });

  const updateForm = (field: keyof GoalForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: GoalType) => {
    const selectedType = goalTypeOptions.find(opt => opt.value === type);
    updateForm('type', type);
    updateForm('unit', selectedType?.defaultUnit || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.target.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetNum = parseInt(form.target);
    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error('Target must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        target: targetNum,
        unit: form.unit.trim(),
        deadline: form.deadline ? form.deadline : undefined,
        priority: form.priority
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(goalData)
      });

      if (response.ok) {
        toast.success('Goal created successfully! 🎯');
        router.push('/goals');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorityOptions.find(p => p.value === form.priority);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/goals">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Goals
          </Link>
        </Button>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Create New Goal
        </motion.h1>
        <p className="text-muted-foreground mt-2">
          Set a new study goal to track your progress and stay motivated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Complete 50 flashcard reviews"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add more details about your goal (optional)"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Goal Type */}
            <div className="space-y-2">
              <Label>Goal Type *</Label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target *</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="100"
                  value={form.target}
                  onChange={(e) => updateForm('target', e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  placeholder="minutes, cards, etc."
                  value={form.unit}
                  onChange={(e) => updateForm('unit', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => updateForm('deadline', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => updateForm('priority', value as GoalPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {selectedPriority && (
                        <Badge className={selectedPriority.color}>
                          {selectedPriority.label}
                        </Badge>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/goals">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
