import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';

export const courseService = {
  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  },

  async getCourses() {
    const querySnapshot = await getDocs(
      query(collection(db, 'courses'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Course[];
  },

  async getCourseById(id: string) {
    const docRef = doc(db, 'courses', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Course;
    }
    return null;
  },

  async getCoursesByInstructor(instructorId: string) {
    const q = query(
      collection(db, 'courses'), 
      where('instructorId', '==', instructorId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Course[];
  },

  async updateCourse(id: string, updates: Partial<Course>) {
    const docRef = doc(db, 'courses', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async deleteCourse(id: string) {
    const docRef = doc(db, 'courses', id);
    await deleteDoc(docRef);
  },

  async getPopularCourses(limitCount = 5) {
    const q = query(
      collection(db, 'courses'),
      where('status', '==', 'active'),
      orderBy('currentParticipants', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Course[];
  }
};