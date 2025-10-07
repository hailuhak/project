import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  File,
  X,
} from "lucide-react";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

interface Resource {
  id: string;
  name: string;
  type: string;
  content: string;
  description?: string;
  courseId?: string;
}

export const Resources: React.FC = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modalResource, setModalResource] = useState<Resource | null>(null);

useEffect(() => {
  if (!currentUser?.uid) return;

  const enrolmentsRef = collection(db, "enrolments");
  const enrolmentQuery = query(enrolmentsRef, where("userId", "==", currentUser.uid));

  const fetchTrainerMaterials = async () => {
    const enrolmentSnapshot = await getDocs(enrolmentQuery);
    const trainerNames = Array.from(
      new Set(enrolmentSnapshot.docs.map((doc) => doc.data().instructorName))
    );

    if (trainerNames.length === 0) {
      setResources([]);
      return;
    }

    // ✅ Firestore `in` query supports up to 10 items
    const materialsRef = collection(db, "trainingMaterials");
    const materialsQuery = query(
      materialsRef,
      where("trainerName", "in", trainerNames)
    );

    const unsubscribe = onSnapshot(materialsQuery, (snapshot) => {
      const fetchedResources: Resource[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || "Untitled Resource",
          type: data.type || "file",
          content: data.content || data.url || "",
          description: data.description || "",
          courseId: data.courseId,
        };
      });
      setResources(fetchedResources);
    });

    return () => unsubscribe();
  };

  fetchTrainerMaterials();
}, [currentUser]);

  // Icon selector
  const getIcon = (type: string) => {
    const baseStyle = "w-8 h-8";
    if (type.includes("pdf")) return <FileText className={`${baseStyle} text-red-500`} />;
    if (type.includes("doc")) return <FileText className={`${baseStyle} text-orange-500`} />;
    if (type.includes("image")) return <ImageIcon className={`${baseStyle} text-green-500`} />;
    if (type.includes("video")) return <VideoIcon className={`${baseStyle} text-purple-500`} />;
    return <File className={`${baseStyle} text-blue-500`} />;
  };

  // Modal handler
  const handleOpen = (res: Resource) => {
    if (res.type.includes("pdf") || res.type.includes("video") || res.type.includes("image")) {
      setModalResource(res);
    } else {
      window.open(res.content, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Resources</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Access course materials from your enrolled courses
        </p>
      </div>

      {/* Resource List */}
      {resources.length === 0 ? (
        <Card className="w-full">
          <CardContent>
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No materials available for your enrolled courses yet...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {resources.map((res) => (
            <Card
              key={res.id}
              onClick={() => handleOpen(res)}
              className="w-full relative rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <CardContent className="flex flex-col gap-3 p-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getIcon(res.type)}
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {res.name}
                      </span>
                      {res.description && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {res.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement("a");
                      link.href = res.content;
                      link.download = res.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 
                               dark:bg-blue-700 dark:hover:bg-blue-600 
                               text-blue-700 dark:text-blue-200 
                               px-3 py-1 rounded-md shadow-sm transition"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* Image Preview */}
                {res.type.includes("image") && (
                  <img
                    src={res.content}
                    alt={res.name}
                    className="w-full h-40 object-contain rounded-md"
                  />
                )}

                {/* Video Preview */}
                {res.type.includes("video") && (
                  <div
                    className="w-full h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700 
                               cursor-pointer rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <VideoIcon className="w-12 h-12 text-purple-500" />
                    <span className="ml-2 text-purple-500 font-medium">Play Video</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl relative p-4">
            <button
              onClick={() => setModalResource(null)}
              className="absolute top-4 right-4 text-gray-700 dark:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {modalResource.name}
            </h2>

            {modalResource.type.includes("pdf") && (
              <iframe
                src={modalResource.content}
                className="w-full h-96 rounded-md"
                title={modalResource.name}
              />
            )}

            {modalResource.type.includes("image") && (
              <img
                src={modalResource.content}
                alt={modalResource.name}
                className="w-full h-96 object-contain rounded-md"
              />
            )}

            {modalResource.type.includes("video") && (
              <video src={modalResource.content} controls className="w-full h-96 rounded-md" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
