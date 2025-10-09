import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  File,
  X,
  Play,
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
  courseName?: string;
  trainerId?: string;
  trainerName?: string;
}

export const Resources: React.FC = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modalResource, setModalResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchResources = async () => {
      try {
        const enrollmentRef = collection(db, "enrollments");
        const enrollmentQuery = query(enrollmentRef, where("userId", "==", currentUser.uid));
        const enrollmentSnapshot = await getDocs(enrollmentQuery);

        if (enrollmentSnapshot.empty) {
          setResources([]);
          setLoading(false);
          return;
        }

        const enrollmentData = enrollmentSnapshot.docs[0].data();
        const enrolledCourseIds = enrollmentData.courses?.map((c: any) => c.courseId) || [];

        if (enrolledCourseIds.length === 0) {
          setResources([]);
          setLoading(false);
          return;
        }

        const materialsRef = collection(db, "trainingMaterials");
        const batchSize = 10;
        const allMaterials: Resource[] = [];

        for (let i = 0; i < enrolledCourseIds.length; i += batchSize) {
          const batch = enrolledCourseIds.slice(i, i + batchSize);
          const materialsQuery = query(
            materialsRef,
            where("courseId", "in", batch)
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
                courseName: data.courseName,
                trainerId: data.trainerId,
                trainerName: data.trainerName,
              };
            });

            allMaterials.push(...fetchedResources);
            const uniqueMaterials = Array.from(
              new Map(allMaterials.map(item => [item.id, item])).values()
            );
            setResources(uniqueMaterials);
            setLoading(false);
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
        setLoading(false);
      }
    };

    fetchResources();
  }, [currentUser]);

  const getIcon = (type: string) => {
    const baseStyle = "w-8 h-8";
    if (type.includes("pdf"))
      return <FileText className={`${baseStyle} text-red-500`} />;
    if (type.includes("doc"))
      return <FileText className={`${baseStyle} text-orange-500`} />;
    if (type.includes("image"))
      return <ImageIcon className={`${baseStyle} text-green-500`} />;
    if (type.includes("video"))
      return <VideoIcon className={`${baseStyle} text-purple-500`} />;
    return <File className={`${baseStyle} text-blue-500`} />;
  };

  const handleOpen = (res: Resource) => {
    if (
      res.type.includes("pdf") ||
      res.type.includes("video") ||
      res.type.includes("image")
    ) {
      setModalResource(res);
    } else {
      window.open(res.content, "_blank");
    }
  };

  const handleDownload = (res: Resource, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = res.content;
    link.download = res.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Learning Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Loading your course materials...
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Learning Resources & E-Learning
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Access course materials, videos, and documents from your enrolled courses
        </p>
      </div>

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
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    {getIcon(res.type)}
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {res.name}
                      </span>
                      {res.courseName && (
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {res.courseName}
                        </span>
                      )}
                      {res.trainerName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          By: {res.trainerName}
                        </span>
                      )}
                      {res.description && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {res.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDownload(res, e)}
                    className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200
                               dark:bg-blue-700 dark:hover:bg-blue-600
                               text-blue-700 dark:text-blue-200
                               px-3 py-1 rounded-md shadow-sm transition"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {res.type.includes("image") && (
                  <img
                    src={res.content}
                    alt={res.name}
                    className="w-full h-40 object-contain rounded-md"
                  />
                )}

                {res.type.includes("video") && (
                  <div
                    className="w-full h-40 flex items-center justify-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900
                               cursor-pointer rounded-md hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800 dark:hover:to-blue-800 transition-colors"
                  >
                    <Play className="w-16 h-16 text-purple-600 dark:text-purple-300" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl relative p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalResource(null)}
              className="absolute top-4 right-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {modalResource.name}
              </h2>
              {modalResource.courseName && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {modalResource.courseName}
                </p>
              )}
              {modalResource.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {modalResource.description}
                </p>
              )}
            </div>

            {modalResource.type.includes("pdf") && (
              <iframe
                src={modalResource.content}
                className="w-full h-[600px] rounded-md"
                title={modalResource.name}
              />
            )}

            {modalResource.type.includes("image") && (
              <img
                src={modalResource.content}
                alt={modalResource.name}
                className="w-full max-h-[600px] object-contain rounded-md"
              />
            )}

            {modalResource.type.includes("video") && (
              <video
                src={modalResource.content}
                controls
                autoPlay
                className="w-full max-h-[600px] rounded-md"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
