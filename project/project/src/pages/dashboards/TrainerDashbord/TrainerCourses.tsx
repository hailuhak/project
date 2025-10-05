import React, { useState, useEffect } from 'react';
import { CourseCard } from '../../../components/courses/CourseCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, BookOpen } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface FormData {
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'draft' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  hours: string;
}

export const TrainerCourses: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    level: 'beginner',
    status: 'active',
    startDate: '',
    endDate: '',
    hours: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Fetch trainer courses
  const fetchCourses = async () => {
    if (!currentUser) return;
    setCoursesLoading(true);
    try {
      const q = query(
        collection(db, 'courses'),
        where('instructorId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const fetchedCourses: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(fetchedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  // Validate a field
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'title':
      case 'category':
        if (!value.trim()) return 'This field is required';
        break;
      case 'hours':
        if (!value || Number(value) <= 0) return 'Hours must be greater than 0';
        break;
      case 'startDate':
        if (!value) return 'Start date is required';
        if (formData.endDate && new Date(value) > new Date(formData.endDate))
          return 'Start date cannot be after end date';
        break;
      case 'endDate':
        if (!value) return 'End date is required';
        if (formData.startDate && new Date(value) < new Date(formData.startDate))
          return 'End date cannot be before start date';
        break;
      default:
        return '';
    }
    return '';
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Clear error on focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Save new or edited course
  const saveCourse = async () => {
    const newErrors: Partial<FormData> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof FormData] = error;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!currentUser) return;

    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), {
          title: formData.title,
          category: formData.category,
          level: formData.level,
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          hours: Number(formData.hours),
          updatedAt: serverTimestamp(),
        });
        setEditingCourseId(null);
      } else {
        await addDoc(collection(db, 'courses'), {
          title: formData.title,
          category: formData.category,
          level: formData.level,
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          hours: Number(formData.hours),
          instructorId: currentUser.uid,
          instructorName: currentUser.displayName,
          createdAt: serverTimestamp(),
          students: [],
        });
      }

      setFormData({
        title: '',
        category: '',
        level: 'beginner',
        status: 'active',
        startDate: '',
        endDate: '',
        hours: '',
      });
      setErrors({});
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      console.error('Error saving course:', err);
    }
  };

  // Delete a course
  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  // Edit a course
  const handleEditCourse = (course: any) => {
    setFormData({
      title: course.title,
      category: course.category,
      level: course.level,
      status: course.status,
      startDate: course.startDate,
      endDate: course.endDate,
      hours: String(course.hours),
    });
    setEditingCourseId(course.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your training courses</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingCourseId(null);
            setFormData({
              title: '',
              category: '',
              level: 'beginner',
              status: 'active',
              startDate: '',
              endDate: '',
              hours: '',
            });
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Course
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-4">
          <Input
            name="title"
            label="Course Title"
            placeholder="Enter course title"
            value={formData.title}
            onChange={handleChange}
            onFocus={handleFocus}
            error={errors.title}
          />
          <Input
            name="category"
            label="Category"
            placeholder="Enter course category"
            value={formData.category}
            onChange={handleChange}
            onFocus={handleFocus}
            error={errors.category}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="startDate"
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={handleChange}
              onFocus={handleFocus}
              error={errors.startDate}
            />
            <Input
              name="endDate"
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={handleChange}
              onFocus={handleFocus}
              error={errors.endDate}
            />
          </div>
          <Input
            name="hours"
            type="number"
            label="Hours"
            placeholder="Enter course hours"
            value={formData.hours}
            onChange={handleChange}
            onFocus={handleFocus}
            error={errors.hours}
          />
          <div className="flex space-x-3">
            <Button onClick={saveCourse}>{editingCourseId ? 'Update Course' : 'Save Course'}</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFormData({
                  title: '',
                  category: '',
                  level: 'beginner',
                  status: 'active',
                  startDate: '',
                  endDate: '',
                  hours: '',
                });
                setErrors({});
                setShowForm(false);
                setEditingCourseId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses assigned yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You will see courses here once the admin assigns them to you.
            </p>
          </div>
        ) : (
          courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              showActions={true}
              onEdit={() => handleEditCourse(course)}
              onDelete={() => handleDeleteCourse(course.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
