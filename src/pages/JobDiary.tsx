import { useParams } from "react-router-dom";

export default function JobDiary() {
  const { jobId } = useParams();
  return <div className="p-6">Job Diary: {jobId}</div>;
}
