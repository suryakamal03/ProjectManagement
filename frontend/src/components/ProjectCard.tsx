import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed';
  assignedMembers: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
  taskStats?: {
    total: number;
    completed: number;
  };
}

export default function ProjectCard({
  id,
  title,
  description,
  status,
  assignedMembers,
  createdAt,
  taskStats,
}: ProjectCardProps) {
  const navigate = useNavigate();

  const completionPercentage = taskStats
    ? taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0
    : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            status === 'Active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Task Progress */}
      {taskStats && taskStats.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">
              {taskStats.completed}/{taskStats.total} tasks
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {assignedMembers.slice(0, 3).map((member) => (
              <div
                key={member._id}
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white"
                title={member.name}
              >
                <span className="text-xs font-semibold text-white">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white">
                <span className="text-xs font-semibold text-gray-600">
                  +{assignedMembers.length - 3}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
        </div>

        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          View
        </button>
      </div>
    </div>
  );
}
