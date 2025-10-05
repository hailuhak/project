import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  Query,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirestoreQuery<T>(
  collectionName: string,
  queryConstraints?: any[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q: Query<DocumentData>;
    
    if (queryConstraints && queryConstraints.length > 0) {
      q = query(collection(db, collectionName), ...queryConstraints);
    } else {
      q = collection(db, collectionName) as Query<DocumentData>;
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firebase timestamps to JavaScript dates
          const processedData = { ...data };
          Object.keys(processedData).forEach(key => {
            if (processedData[key] && typeof processedData[key].toDate === 'function') {
              processedData[key] = processedData[key].toDate();
            }
          });
          items.push({ id: doc.id, ...processedData } as T);
        });
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore query error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}