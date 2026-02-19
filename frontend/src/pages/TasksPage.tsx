import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { axiosInstance } from '../services/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'InProgress' | 'Done';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate: string;
  createdAt: string;
  projectId: string;
}

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  tasks: Task[];
}

interface TaskWithProject extends Task {
  projectTitle: string;
  projectId: string;
}

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Todo' | 'InProgress' | 'Done'>('All');
  const [filterPriority, setFilterPriority] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  useEffect(() => {
    fetchTasksData();
  }, []);

  const fetchTasksData = async () => {
    try {
      setLoading(true);

      // Fetch all projects
      const projectsRes = await axiosInstance.get('/project/all');
      const projectsData: Project[] = projectsRes.data.projects || [];

      // Fetch tasks for each project
      const projectsWithTasks = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const tasksRes = await axiosInstance.get(`/project/${project._id}/tasks`);
            return {
              ...project,
              tasks: tasksRes.data.tasks || [],
            };
          } catch {
            return {
              ...project,
              tasks: [],
            };
          }
        })
      );

      setProjects(projectsWithTasks);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (projectId: string, taskId: string, newStatus: 'Todo' | 'InProgress' | 'Done') => {
    try {
      // Find the task to get its current data
      const project = projects.find(p => p._id === projectId);
      const task = project?.tasks.find(t => t._id === taskId);
      
      if (!task) return;

      await axiosInstance.put(`/project/${projectId}/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
        assignedTo: task.assignedTo._id,
        dueDate: task.dueDate,
      });

      await fetchTasksData();
    } catch (error) {
      const message = error instanceof Error && (error as any).response?.data?.message || 'Failed to update task status';
      alert(message);
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await axiosInstance.delete(`/project/${projectId}/tasks/${taskId}`);
      await fetchTasksData();
    } catch (error) {
      const message = error instanceof Error && (error as any).response?.data?.message || 'Failed to delete task';
      alert(message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'InProgress':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Todo':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status === 'InProgress' ? 'In Progress' : status;
  };

  const filterTasks = (tasks: TaskWithProject[]) => {
    return tasks.filter(task => {
      const statusMatch = filterStatus === 'All' || task.status === filterStatus;
      const priorityMatch = filterPriority === 'All' || task.priority === filterPriority;
      return statusMatch && priorityMatch;
    });
  };

  const allTasks: TaskWithProject[] = projects.flatMap(project => 
    project.tasks.map(task => ({ 
      ...task, 
      projectTitle: project.title,
      projectId: project._id 
    }))
  );

  const filteredTasks = filterTasks(allTasks);

  // Statistics
  const stats = {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === 'Todo').length,
    inProgress: allTasks.filter(t => t.status === 'InProgress').length,
    done: allTasks.filter(t => t.status === 'Done').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 lg:ml-64 pt-16">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin() ? 'All Tasks' : 'My Tasks'}
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage your tasks across all projects
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Todo</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Done</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.done}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Todo' | 'InProgress' | 'Done')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Todo">Todo</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Priority:</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as 'All' | 'Low' | 'Medium' | 'High')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="ml-auto text-sm text-gray-600">
                  Showing {filteredTasks.length} of {allTasks.length} tasks
                </div>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.title}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                            {getStatusDisplay(task.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Project: <span className="font-medium text-gray-700">{task.projectTitle}</span>
                        </p>
                        <p className="text-gray-600 text-sm mb-3">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{task.assignedTo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Change Buttons */}
                        {task.status !== 'Todo' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.projectId, task._id, 'Todo')}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            To Do
                          </button>
                        )}
                        {task.status !== 'InProgress' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.projectId, task._id, 'InProgress')}
                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                          >
                            In Progress
                          </button>
                        )}
                        {task.status !== 'Done' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.projectId, task._id, 'Done')}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                          >
                            Done
                          </button>
                        )}

                        {/* Delete Button (for assigned user or admin) */}
                        {(isAdmin() || task.assignedTo._id === user?.id) && (
                          <button
                            onClick={() => handleDeleteTask(task.projectId, task._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filterStatus !== 'All' || filterPriority !== 'All' ? 'No Tasks Match Filters' : 'No Tasks Yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filterStatus !== 'All' || filterPriority !== 'All' 
                    ? 'Try adjusting your filters to see more tasks' 
                    : 'Tasks will appear here once they are created'
                  }
                </p>
                {(filterStatus !== 'All' || filterPriority !== 'All') && (
                  <button
                    onClick={() => {
                      setFilterStatus('All');
                      setFilterPriority('All');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
