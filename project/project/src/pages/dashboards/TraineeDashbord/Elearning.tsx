import React, { useEffect, useState } from 'react';
import { BookOpen, CirclePlay as PlayCircle, FileText, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';

interface ElearningModule {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz';
  duration: number;
  completed: boolean;
  contentUrl?: string;
}

export const Elearning: React.FC = () => {
  const { currentUser } = useAuth();
  const [modules, setModules] = useState<ElearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ElearningModule | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      if (!currentUser) return;
      try {
        const enrollmentRef = collection(db, 'enrollments');
        const enrollmentQuery = query(enrollmentRef, where('userId', '==', currentUser.uid));
        const enrollmentSnap = await getDocs(enrollmentQuery);

        const enrolledCourseIds: string[] = [];
        enrollmentSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.courseIds && Array.isArray(data.courseIds)) {
            enrolledCourseIds.push(...data.courseIds);
          } else if (data.courseId) {
            enrolledCourseIds.push(data.courseId);
          }
        });

        if (!enrolledCourseIds.length) {
          setModules([]);
          setLoading(false);
          return;
        }

        const coursesRef = collection(db, 'courses');
        const coursesSnap = await getDocs(coursesRef);
        const coursesMap = new Map();
        coursesSnap.docs.forEach(doc => {
          coursesMap.set(doc.id, doc.data().title || 'Unknown Course');
        });

        const materialsRef = collection(db, 'trainingMaterials');
        const materialsSnap = await getDocs(materialsRef);

        const modulesData: ElearningModule[] = materialsSnap.docs
          .filter(doc => {
            const courseId = doc.data().courseId;
            return courseId && enrolledCourseIds.includes(courseId);
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              courseId: data.courseId,
              courseName: coursesMap.get(data.courseId) || 'Unknown Course',
              title: data.name || 'Untitled Module',
              description: data.description || 'No description available',
              type: data.type?.includes('video') ? 'video' : data.type?.includes('pdf') || data.type?.includes('document') ? 'document' : 'document',
              duration: data.duration || 0,
              completed: data.completed || false,
              contentUrl: data.content || data.url,
            };
          });

        setModules(modulesData);
      } catch (err) {
        console.error('Error fetching modules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [currentUser]);

  const handleModuleClick = (module: ElearningModule) => {
    setSelectedModule(module);
  };

  const handleCompleteModule = async (moduleId: string) => {
    try {
      const moduleRef = doc(db, 'trainingMaterials', moduleId);
      await updateDoc(moduleRef, { completed: true });

      setModules(prev =>
        prev.map(m => (m.id === moduleId ? { ...m, completed: true } : m))
      );
      setSelectedModule(null);
    } catch (err) {
      console.error('Error completing module:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-8 h-8 text-blue-500" />;
      case 'document': return <FileText className="w-8 h-8 text-red-500" />;
      case 'quiz': return <BookOpen className="w-8 h-8 text-green-500" />;
      default: return <BookOpen className="w-8 h-8 text-gray-500" />;
    }
  };

  const completedCount = modules.filter(m => m.completed).length;
  const progressPercentage = modules.length ? (completedCount / modules.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-Learning</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Access your online learning modules and track your progress
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Overall Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedCount} of {modules.length} modules completed
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progressPercentage.toFixed(0)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading modules...</div>
      ) : !modules.length ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No e-learning modules available. Enroll in courses to access materials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <div
              key={module.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleModuleClick(module)}
            >
              <Card className="h-full">
                <CardHeader className="flex justify-between items-start">
                  {getIcon(module.type)}
                  {module.completed && <CheckCircle className="w-6 h-6 text-green-500" />}
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{module.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {module.duration || 'N/A'} min
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {module.type.charAt(0).toUpperCase() + module.type.slice(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl relative p-6">
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 right-4 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white text-2xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedModule.title}</h2>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Course: {selectedModule.courseName}</p>
              <p className="text-gray-700 dark:text-gray-300">{selectedModule.description}</p>
            </div>

            <div className="mb-6">
              {selectedModule.type === 'video' && selectedModule.contentUrl && (
                <video src={selectedModule.contentUrl} controls className="w-full rounded-lg" />
              )}
              {selectedModule.type === 'document' && selectedModule.contentUrl && (
                <iframe src={selectedModule.contentUrl} className="w-full h-96 rounded-lg" title={selectedModule.title} />
              )}
            </div>

            {!selectedModule.completed && (
              <button
                onClick={() => handleCompleteModule(selectedModule.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
