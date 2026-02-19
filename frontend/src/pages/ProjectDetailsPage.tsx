import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { axiosInstance } from '../services/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import html2pdf from 'html2pdf.js';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedMembers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

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
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showAssignMemberModal, setShowAssignMemberModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Form states
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    status: 'Todo' as 'Todo' | 'InProgress' | 'Done',
    dueDate: '',
  });
  
  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    status: 'Active' as 'Active' | 'Completed',
  });
  
  const [assignData, setAssignData] = useState({
    userId: '',
  });
  
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Todo' | 'InProgress' | 'Done'>('All');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [checkingPriority, setCheckingPriority] = useState(false);

  const toggleTaskDetails = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await axiosInstance.get(`/project/${id}`);
      const projectData = projectRes.data.project;
      
      console.log('Fetched project data:', projectData);
      console.log('Assigned members:', projectData.assignedMembers);
      
      setProject(projectData);
      
      // Fetch tasks for this project
      const tasksRes = await axiosInstance.get(`/project/${id}/tasks`);
      setTasks(tasksRes.data.tasks || []);
      
    } catch (error) {
      console.error('Error fetching project details:', error);
      navigate('/projects');
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

  const openCreateTaskModal = async () => {
    setShowCreateTaskModal(true);
    if (isAdmin()) {
      await fetchUsers();
    } else {
      // Auto-assign to self for members
      setTaskFormData(prev => ({ ...prev, assignedTo: user?.id || '' }));
    }
  };

  const openAssignMemberModal = async () => {
    if (!isAdmin()) return;
    await fetchUsers();
    setShowAssignMemberModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!taskFormData.title.trim() || !taskFormData.assignedTo || !taskFormData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setFormLoading(true);

    try {
      await axiosInstance.post(`/project/${id}/tasks`, {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
        assignedTo: taskFormData.assignedTo,
        priority: taskFormData.priority,
        status: taskFormData.status,
        dueDate: taskFormData.dueDate,
      });

      setTaskFormData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
      });
      setShowCreateTaskModal(false);
      await fetchProjectDetails();
    } catch (error) {
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      setError(response?.data?.message || 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!taskFormData.title.trim()) {
      setError('Please enter a task title first');
      return;
    }

    setGeneratingDescription(true);
    setError('');

    try {
      const response = await axiosInstance.post('/ai/generate-description', {
        title: taskFormData.title.trim(),
      });
      setTaskFormData({ ...taskFormData, description: response.data.description });
    } catch {
      setError('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleCheckPriority = async () => {
    if (!taskFormData.title.trim() || !taskFormData.description.trim()) {
      setError('Title and description fields are required for priority check');
      return;
    }

    setCheckingPriority(true);
    setError('');

    try {
      const response = await axiosInstance.post('/ai/suggest-priority', {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
      });
      setTaskFormData({ ...taskFormData, priority: response.data.priority });
    } catch {
      setError('Failed to check priority');
    } finally {
      setCheckingPriority(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    
    setAiLoading(true);

    try {
      const response = await axiosInstance.post('/ai/generate-summary', { projectId: id });
      const summaryContent = response.data.summary;
      
      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Project Summary: ${project?.title}</h1>
          <div style="color: #666; font-size: 14px; margin-bottom: 20px;">Generated on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <p style="white-space: pre-wrap; color: #333;">${summaryContent}</p>
        </div>
      `;
      
      // Create temporary element
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      // Configure PDF options
      const opt = {
        margin: 10,
        filename: `${project?.title} summary.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      // Generate and download PDF
      html2pdf().set(opt).from(element).save();
    } catch {
      setError('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    
    setAiLoading(true);

    try {
      const response = await axiosInstance.post('/ai/generate-weekly-report', { projectId: id });
      const reportContent = response.data.report;
      
      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Weekly Report: ${project?.title}</h1>
          <div style="color: #666; font-size: 14px; margin-bottom: 20px;">Generated on: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <p style="white-space: pre-wrap; color: #333;">${reportContent}</p>
        </div>
      `;
      
      // Create temporary element
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      // Configure PDF options
      const opt = {
        margin: 10,
        filename: `${project?.title} report.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      // Generate and download PDF
      html2pdf().set(opt).from(element).save();
    } catch {
      setError('Failed to generate report');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      await axiosInstance.put(`/project/${id}`, {
        title: projectFormData.title.trim(),
        description: projectFormData.description.trim(),
        status: projectFormData.status,
      });

      setShowEditProjectModal(false);
      await fetchProjectDetails();
    } catch (error) {
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      setError(response?.data?.message || 'Failed to update project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignData.userId) return;

    setFormLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post(`/project/${id}/assign-member`, {
        memberId: assignData.userId,
      });

      console.log('Member assigned successfully:', response.data);

      setShowAssignMemberModal(false);
      setAssignData({ userId: '' });
      
      // Refresh project details
      await fetchProjectDetails();
      
      console.log('Project details refreshed');
    } catch (error) {
      console.error('Error assigning member:', error);
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      setError(response?.data?.message || 'Failed to assign member');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setFormLoading(true);
    try {
      await axiosInstance.delete(`/project/${id}/tasks/${taskToDelete}`);
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
      await fetchProjectDetails();
    } catch (error) {
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      setError(response?.data?.message || 'Failed to delete task');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteTaskModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteTaskModal(true);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'Todo' | 'InProgress' | 'Done') => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      await axiosInstance.put(`/project/${id}/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
        assignedTo: task.assignedTo._id,
        dueDate: task.dueDate,
      });

      await fetchProjectDetails();
    } catch (error) {
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      alert(response?.data?.message || 'Failed to update task');
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, newPriority: 'Low' | 'Medium' | 'High') => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      await axiosInstance.put(`/project/${id}/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        priority: newPriority,
        status: task.status,
        assignedTo: task.assignedTo._id,
        dueDate: task.dueDate,
      });

      await fetchProjectDetails();
    } catch (error) {
      const response = error instanceof Error ? (error as { response?: { data?: { message?: string } } }).response : undefined;
      alert(response?.data?.message || 'Failed to update task');
    }
  };

  const openEditProjectModal = () => {
    if (!project) return;
    setProjectFormData({
      title: project.title,
      description: project.description,
      status: project.status,
    });
    setShowEditProjectModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:ml-64 pt-16">
            <div className="p-6 max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    done: tasks.filter(t => t.status === 'Done').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 lg:ml-64 pt-16">
          <div className="px-6 pb-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-3">
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
              </button>
              
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${project.status === 'Active' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {project.status}
                  </span>
                  {isAdmin() && (
                    <>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={aiLoading}
                        className="ml-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        Generate Summary
                      </button>
                      <button
                        onClick={handleGenerateReport}
                        disabled={aiLoading}
                        className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        Generate Report
                      </button>
                      <button
                        onClick={openEditProjectModal}
                        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Edit Project
                      </button>
                      <button
                        onClick={openAssignMemberModal}
                        className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Member
                      </button>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-6 text-base text-gray-800">
                  <span><span className="font-semibold">Created By:</span> {project.createdBy.name}</span>
                  <span><span className="font-semibold">Team Members:</span> {project.assignedMembers.length}</span>
                  <span><span className="font-semibold">Created On:</span> {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2"><span className="font-semibold">Team:</span> {project.assignedMembers.map((m) => (
                    <span key={m._id} className="bg-gray-100 rounded px-2 py-1 text-sm font-medium text-gray-900 mr-1">{m.name}</span>
                  ))}</span>
                </div>
                <p className="text-gray-600 mt-2">{project.description}</p>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Tasks</h2>
                  <p className="text-sm text-gray-600">
                    {taskStats.done} of {taskStats.total} completed
                  </p>
                </div>
                <button
                  onClick={openCreateTaskModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </button>
              </div>

              {/* Task Filter Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                    statusFilter === 'All'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('Todo')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                    statusFilter === 'Todo'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todo
                </button>
                <button
                  onClick={() => setStatusFilter('InProgress')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                    statusFilter === 'InProgress'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('Done')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                    statusFilter === 'Done'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Tasks List */}
              {tasks.filter(task => statusFilter === 'All' || task.status === statusFilter).length > 0 ? (
                <div className="space-y-3">
                  {tasks.filter(task => statusFilter === 'All' || task.status === statusFilter).map((task) => {
                    const isExpanded = expandedTasks.has(task._id);
                    return (
                      <div key={task._id} className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleTaskDetails(task._id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                              </div>
                              
                              {isExpanded && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {task.assignedTo.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(task._id, e.target.value as 'Todo' | 'InProgress' | 'Done');
                                }}
                                className="px-2 py-1 text-xs font-medium bg-transparent appearance-none cursor-pointer focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                                style={{ backgroundImage: 'none' }}
                              >
                                <option value="Todo">Todo</option>
                                <option value="InProgress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                              <select
                                value={task.priority}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskPriority(task._id, e.target.value as 'Low' | 'Medium' | 'High');
                                }}
                                className="px-2 py-1 text-xs font-medium bg-transparent appearance-none cursor-pointer focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                                style={{ backgroundImage: 'none' }}
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                              {(isAdmin() || task.assignedTo._id === user?.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteTaskModal(task._id);
                                  }}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                  <p className="text-gray-600 mb-4">Add tasks to get started with this project</p>
                  <button
                    onClick={openCreateTaskModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Add First Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button
                onClick={() => {
                  setShowCreateTaskModal(false);
                  setTaskFormData({
                    title: '',
                    description: '',
                    assignedTo: '',
                    priority: 'Medium',
                    status: 'Todo',
                    dueDate: '',
                  });
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
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
                        <option value="">Select user</option>
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

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTaskModal(false);
                    setTaskFormData({
                      title: '',
                      description: '',
                      assignedTo: '',
                      priority: 'Medium',
                      status: 'Todo',
                      dueDate: '',
                    });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
              <button
                onClick={() => {
                  setShowEditProjectModal(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
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
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as 'Active' | 'Completed' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {showAssignMemberModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Member</h2>
              <button
                onClick={() => {
                  setShowAssignMemberModal(false);
                  setAssignData({ userId: '' });
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignMember} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Assign a member to: <span className="font-semibold text-gray-900">{project.title}</span>
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User *
                </label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignMemberModal(false);
                    setAssignData({ userId: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {formLoading ? 'Assigning...' : 'Assign Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteTaskModal && taskToDelete && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Task</h2>
              <button
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setTaskToDelete(null);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Are you sure?</h3>
                  <p className="text-sm text-gray-600">
                    Do you really want to delete this task? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteTaskModal(false);
                    setTaskToDelete(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {formLoading ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
