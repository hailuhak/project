import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import { User } from "../types";

interface UserProgress {
  videoHours: number;
  documentHours: number;
  attendanceHours: number;
}

export const useUserProgress = (currentUser: User): UserProgress => {
  const [videoHours, setVideoHours] = useState(0);
  const [documentHours, setDocumentHours] = useState(0);
  const [attendanceHours, setAttendanceHours] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // 🔹 Listen to video progress
    const videoQ = query(
      collection(db, "videoProgress"),
      where("userId", "==", currentUser.uid)
    );
    const unsubVideo = onSnapshot(videoQ, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DocumentData;
        // store progress in minutes → convert to hours
        total += (data.minutesWatched ?? 0) / 60;
      });
      setVideoHours(total);
    });

    // 🔹 Listen to document downloads
    const docQ = query(
      collection(db, "documentProgress"),
      where("userId", "==", currentUser.uid)
    );
    const unsubDocs = onSnapshot(docQ, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DocumentData;
        // assume each doc has estimatedHours field
        total += data.estimatedHours ?? 0;
      });
      setDocumentHours(total);
    });

    // 🔹 Listen to attendance
    const attQ = query(
      collection(db, "attendance"),
      where("userId", "==", currentUser.uid)
    );
    const unsubAttendance = onSnapshot(attQ, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DocumentData;
        // each session has durationMinutes
        total += (data.durationMinutes ?? 0) / 60;
      });
      setAttendanceHours(total);
    });

    return () => {
      unsubVideo();
      unsubDocs();
      unsubAttendance();
    };
  }, [currentUser?.uid]);

  return { videoHours, documentHours, attendanceHours };
};
