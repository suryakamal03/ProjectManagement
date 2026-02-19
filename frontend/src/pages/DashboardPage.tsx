import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { axiosInstance } from '../services/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed';
  assignedMembers: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
}

interface Task {
  _id: string;
  projectId: string;
  status: 'Todo' | 'InProgress' | 'Done';
}

interface Stats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  teamMembers?: number;
}

interface ProjectFormData {
  title: string;
  description: string;
}

interface TaskFormData {
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'InProgress' | 'Done';
  dueDate: string;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  
  // Modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  
  // Form states
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
  });
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    projectId: '',
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    status: 'Todo',
    dueDate: '',
  });
  
  const [projectFormError, setProjectFormError] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [projectFormLoading, setProjectFormLoading] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [checkingPriority, setCheckingPriority] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const projectsRes = await axiosInstance.get('/project/all');
      const projects: Project[] = projectsRes.data.projects || [];

      // Fetch tasks for all projects
      const tasksPromises = projects.map((project) =>
        axiosInstance.get(`/project/${project._id}/tasks`).catch(() => ({ data: { tasks: [] } }))
      );
      const tasksResults = await Promise.all(tasksPromises);
      const allTasks: Task[] = tasksResults.flatMap((res) => res.data.tasks || []);

      // Calculate stats
      const activeTasks = allTasks.filter((task) => task.status !== 'Done').length;
      const completedTasks = allTasks.filter((task) => task.status === 'Done').length;

      // Get team members count if admin
      let teamMembersCount = undefined;
      if (isAdmin()) {
        try {
          const uniqueMembers = new Set<string>();
          projects.forEach((project) => {
            project.assignedMembers.forEach((member) => {
              uniqueMembers.add(member._id);
            });
          });
          teamMembersCount = uniqueMembers.size;
        } catch (err) {
          console.error('Error calculating team members:', err);
        }
      }

      setStats({
        totalProjects: projects.length,
        activeTasks,
        completedTasks,
        teamMembers: teamMembersCount,
      });

      // Get recent projects (last 4)
      const sortedProjects = [...projects].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentProjects(sortedProjects.slice(0, 4));
      setAllProjects(projects); // Store all projects for task creation
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin()) return;
    try {
      const response = await axiosInstance.get('/user/all');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Open Create Task Modal - fetch users and projects when opening
  const openCreateTaskModal = async () => {
    setShowCreateTaskModal(true);
    
    // Fetch all projects if not already loaded
    if (allProjects.length === 0) {
      try {
        const projectsRes = await axiosInstance.get('/project/all');
        setAllProjects(projectsRes.data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }
    
    // Auto-assign to self for members
    if (!isAdmin()) {
      setTaskFormData(prev => ({ ...prev, assignedTo: user?.id || '' }));
    }
    
    // Fetch users if admin and not already loaded
    if (isAdmin() && users.length === 0) {
      await fetchUsers();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectFormError('');

    if (!projectFormData.title.trim() || !projectFormData.description.trim()) {
      setProjectFormError('Please fill in all fields');
      return;
    }

    setProjectFormLoading(true);

    try {
      await axiosInstance.post('/project/create', {
        title: projectFormData.title.trim(),
        description: projectFormData.description.trim(),
      });

      // Reset form and close modal
      setProjectFormData({ title: '', description: '' });
      setShowCreateProjectModal(false);

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      const message = error instanceof Error && (error as any).response?.data?.message || 'Failed to create project';
      setProjectFormError(message);
    } finally {
      setProjectFormLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError('');

    if (
      !taskFormData.projectId ||
      !taskFormData.title.trim() ||
      !taskFormData.assignedTo ||
      !taskFormData.dueDate
    ) {
      setTaskFormError('Please fill in all required fields');
      return;
    }

    setTaskFormLoading(true);

    try {
      await axiosInstance.post(`/project/${taskFormData.projectId}/tasks`, {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
        assignedTo: taskFormData.assignedTo,
        priority: taskFormData.priority,
        status: taskFormData.status,
        dueDate: taskFormData.dueDate,
      });

      // Reset form and close modal
      setTaskFormData({
        projectId: '',
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
      });
      setShowCreateTaskModal(false);

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      const message = error instanceof Error && (error as any).response?.data?.message || 'Failed to create task';
      setTaskFormError(message);
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!taskFormData.title.trim()) {
      setTaskFormError('Please enter a task title first');
      return;
    }

    setGeneratingDescription(true);
    setTaskFormError('');

    try {
      const response = await axiosInstance.post('/ai/generate-description', {
        title: taskFormData.title.trim(),
      });
      setTaskFormData({ ...taskFormData, description: response.data.description });
    } catch (error) {
      setTaskFormError('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleCheckPriority = async () => {
    if (!taskFormData.title.trim() || !taskFormData.description.trim()) {
      setTaskFormError('Title and description fields are required for priority check');
      return;
    }

    setCheckingPriority(true);
    setTaskFormError('');

    try {
      const response = await axiosInstance.post('/ai/suggest-priority', {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
      });
      setTaskFormData({ ...taskFormData, priority: response.data.priority });
    } catch (error) {
      setTaskFormError('Failed to check priority');
    } finally {
      setCheckingPriority(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <main className="p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back,
            </h1>
            <p className="text-gray-600">{getCurrentDate()}</p>
          </div>

          {/* Statistics Cards */}
          <div className={`grid gap-6 mb-8 ${isAdmin() ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
              color="blue"
            />
            
            <StatCard
              title="Active Tasks"
              value={stats.activeTasks}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="orange"
            />
            
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="green"
            />

            {isAdmin() && stats.teamMembers !== undefined && (
              <StatCard
                title="Team Members"
                value={stats.teamMembers}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                color="purple"
              />
            )}
          </div>

          {/* Recent Projects & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="grid gap-4">
                  {recentProjects.map((project) => (
                    <ProjectCard
                      key={project._id}
                      id={project._id}
                      title={project.title}
                      description={project.description}
                      status={project.status}
                      assignedMembers={project.assignedMembers}
                      createdAt={project.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first project</p>
                  {isAdmin() && (
                    <button
                      onClick={() => setShowCreateProjectModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Create Project
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                {isAdmin() && (
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition text-left"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Create Project</h3>
                      <p className="text-sm text-gray-600">Start a new project</p>
                    </div>
                  </button>
                )}

                <button
                  onClick={openCreateTaskModal}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-200 transition text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Task</h3>
                    <p className="text-sm text-gray-600">Add a new task</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
              <button
                onClick={() => {
                  setShowCreateProjectModal(false);
                  setProjectFormData({ title: '', description: '' });
                  setProjectFormError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProject} className="p-6">
              {projectFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {projectFormError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectFormData.title}
                    onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project description"
                    rows={4}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProjectModal(false);
                    setProjectFormData({ title: '', description: '' });
                    setProjectFormError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={projectFormLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {projectFormLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button
                onClick={() => {
                  setShowCreateTaskModal(false);
                  setTaskFormData({
                    projectId: '',
                    title: '',
                    description: '',
                    assignedTo: '',
                    priority: 'Medium',
                    status: 'Todo',
                    dueDate: '',
                  });
                  setTaskFormError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTask} className="p-6">
              {taskFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {taskFormError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={taskFormData.projectId}
                    onChange={(e) => setTaskFormData({ ...taskFormData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">
                      {allProjects.length === 0 ? 'No projects available - Create a project first' : 'Select a project'}
                    </option>
                    {allProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title} - {project.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter task description"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generatingDescription || !taskFormData.title.trim()}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {generatingDescription ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To *
                    </label>
                    {isAdmin() ? (
                      <select
                        value={taskFormData.assignedTo}
                        onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">
                          {users.length === 0 ? 'Loading users...' : 'Select user'}
                        </option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={user?.name || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <div className="space-y-2">
                      <select
                        value={taskFormData.priority}
                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCheckPriority}
                        disabled={checkingPriority || !taskFormData.title.trim() || !taskFormData.description.trim()}
                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {checkingPriority ? 'Checking...' : 'Check'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={taskFormData.status}
                      onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value as 'Todo' | 'InProgress' | 'Done' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Todo">Todo</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTaskModal(false);
                    setTaskFormData({
                      projectId: '',
                      title: '',
                      description: '',
                      assignedTo: '',
                      priority: 'Medium',
                      status: 'Todo',
                      dueDate: '',
                    });
                    setTaskFormError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskFormLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {taskFormLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
