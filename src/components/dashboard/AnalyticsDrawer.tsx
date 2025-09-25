import React, { useState, useEffect } from 'react';
import { User, UserSession } from '@/types/auth';
import DailyActivityChart from './DailyActivityChart';
import { BASE_URL_AI } from '@/libraries/constant';

interface ChatHistory {
  content: string;
  role: "user" | "assistant";
}

interface Session {
  session_id: string;
  chat_history: ChatHistory[];
  message_count: number;
  updated_at: number;
  last_message: string;
  user_messages_count: number;
  agent_messages_count: number;
}

interface AnalyticsData {
  success: boolean;
  sub_id: string;
  total_sessions: number;
  total_messages: number;
  total_user_messages: number;
  total_agent_messages: number;
  sessions: Session[];
  error: string | null;
}

interface AnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  currentUserSession?: User | UserSession;
}

const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  agentId, 
  currentUserSession 
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!currentUserSession?.sub_id) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL_AI}/api/sub/${currentUserSession.sub_id}/agent/${agentId}/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUserSession?.sub_id) {
      fetchAnalytics();
    }
  }, [isOpen, currentUserSession?.sub_id]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateChartData = () => {
    if (!analyticsData?.sessions) return [];

    const dailyData: Record<string, number> = {};

    analyticsData.sessions.forEach((session) => {
      const date = new Date(session.updated_at * 1000);
      const dayKey = date.toISOString().split("T")[0];

      dailyData[dayKey] = (dailyData[dayKey] || 0) + session.message_count;
    });

    const sortedEntries = Object.entries(dailyData).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );

    const recentEntries = sortedEntries.slice(-30);

    return recentEntries.map(([dateStr, count]) => {
      const date = new Date(dateStr);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const displayLabel = `${month} ${date.getDate()}`;

      return {
        date: dateStr,
        day: date.getDate(),
        month,
        count,
        displayLabel,
      };
    });
  };

  const chartData = generateChartData();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">View detailed analytics including chat history, message statistics, and performance insights.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600 font-medium">Loading analytics...</span>
                </div>
              ) : error ? (
                <div className="text-center p-8 bg-white rounded-xl border border-red-200 shadow-sm">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-red-900 font-semibold mb-2">Error Loading Analytics</p>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={fetchAnalytics}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Overview Stats */}
                  <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Performance Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="text-2xl font-bold text-indigo-900">
                          {analyticsData.total_sessions}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-2xl font-bold text-blue-900">
                          {analyticsData.total_messages}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Messages</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-900">
                          {analyticsData.total_user_messages}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">User Messages</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-900">
                          {analyticsData.total_agent_messages}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Agent Messages</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Activity Chart */}
                  {chartData.length > 0 && (
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Daily Message Activity (Last 30 Days)
                      </h4>
                      <DailyActivityChart chartData={chartData} />
                    </div>
                  )}

                  {/* Chat Sessions Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Session List */}
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Chat Sessions
                      </h4>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-100">
                        {analyticsData.sessions && analyticsData.sessions.length > 0 ? (
                          analyticsData.sessions.map((session, index) => (
                            <button
                              key={session.session_id}
                              onClick={() => setSelectedSession(session)}
                              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                                selectedSession?.session_id === session.session_id
                                  ? "bg-indigo-50 border-indigo-300 shadow-md"
                                  : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm"
                              }`}
                            >
                              <div className="font-semibold text-gray-900">
                                Session {index + 1}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center justify-between">
                                <span>{session.message_count} messages</span>
                                <span>{formatDate(session.updated_at)}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 truncate">
                                {session.last_message}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                              No Chat Sessions Yet
                            </h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                              Once users start interacting with your AI agent, their
                              conversation history will appear here for analysis and
                              review.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat View */}
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      {selectedSession ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex space-x-2 text-xs">
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                User: {selectedSession.user_messages_count}
                              </span>
                              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                                Agent: {selectedSession.agent_messages_count}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto border border-gray-200 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-100">
                            <div className="space-y-4">
                              {selectedSession.chat_history.map((message, index) => (
                                <div
                                  key={index}
                                  className={`flex ${
                                    message.role === "user" ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <div className="flex items-start space-x-3 max-w-[85%]">
                                    {message.role === "assistant" && (
                                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                          className="w-4 h-4 text-indigo-600"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                      </div>
                                    )}

                                    <div
                                      className={`px-4 py-3 rounded-xl text-sm shadow-sm ${
                                        message.role === "user"
                                          ? "bg-indigo-600 text-white rounded-br-none"
                                          : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap leading-relaxed">
                                        {message.content}
                                      </p>
                                    </div>

                                    {message.role === "user" && (
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                          className="w-4 h-4 text-gray-600"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 text-sm text-gray-500 text-center bg-gray-50 py-2 rounded-lg border border-gray-200">
                            Last active: {formatDate(selectedSession.updated_at)} at{" "}
                            {formatTime(selectedSession.updated_at)}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-500 py-20">
                          <svg
                            className="w-16 h-16 mx-auto mb-4 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <p className="text-gray-900 font-medium mb-2">No Session Selected</p>
                          <p className="text-sm">Select a chat session from the list to view detailed conversation history and messages.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {/* Agent ID: {agentId} */}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                style={{ cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDrawer;