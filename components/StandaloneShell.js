'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ImageStudio,
  VideoStudio,
  ClippingStudio,
  VibeMotionStudio,
  LipSyncStudio,
  CinemaStudio,
  AudioStudio,
  MarketingStudio,
  WorkflowStudio,
  AgentStudio,
  AppsStudio,
} from 'studio';
import BrandLogo from '@/components/BrandLogo';

const DesignAgentStudio = dynamic(() => import('studio').then((mod) => mod.DesignAgentStudio), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-black flex items-center justify-center text-white/20">
      Loading Design Studio...
    </div>
  ),
});

const TABS = [
  { id: 'image', label: 'Image Studio' },
  { id: 'video', label: 'Video Studio' },
  { id: 'audio', label: 'Audio Studio' },
  { id: 'clipping', label: 'AI Clipping' },
  { id: 'vibe-motion', label: 'Vibe Motion' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema', label: 'Cinema Studio' },
  { id: 'marketing', label: 'Marketing Studio' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'agents', label: 'Agents' },
  { id: 'design-agent', label: 'Design Agent' },
  { id: 'apps', label: 'Explore Apps' },
];

const API_CONTEXT = 'fal-proxy';

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || [];
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) return { id: idFromParams, tab: tabFromParams || null };
    const wfIndex = slug.findIndex((s) => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null,
    };
  }, [slug, idFromParams, tabFromParams]);

  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find((tab) => tab.id === firstSegment)) return firstSegment;
    return 'image';
  };

  const { id: urlWorkflowId } = getWorkflowInfo();
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
      setActiveTab('workflows');
    } else if (slug.includes('agents')) {
      setActiveTab('agents');
    } else if (slug.includes('design-agent')) {
      setActiveTab('design-agent');
    } else if (slug.includes('apps')) {
      setActiveTab('apps');
    } else {
      const firstSegment = slug[0];
      if (firstSegment && TABS.find((tab) => tab.id === firstSegment)) {
        setActiveTab(firstSegment);
      }
    }
  }, [slug, getWorkflowInfo]);

  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    setIsHeaderVisible(!(isEditingWorkflow || activeTab === 'design-agent'));
  }, [activeTab, urlWorkflowId, idFromParams]);

  useEffect(() => {
    const fromBuilder = sessionStorage.getItem('fromWorkflowBuilder');
    const fromDesignAgent = sessionStorage.getItem('fromDesignAgent');

    if ((fromBuilder && activeTab !== 'workflows') || (fromDesignAgent && activeTab !== 'design-agent')) {
      sessionStorage.removeItem('fromWorkflowBuilder');
      sessionStorage.removeItem('fromDesignAgent');
      window.location.reload();
    }
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    router.push(`/studio/${tabId}`);
  };

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) setDroppedFiles(files);
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin text-[#22d3ee] text-3xl">o</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-[#030303] flex flex-col overflow-hidden text-white relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-[#22d3ee]/10 backdrop-blur-md border-4 border-dashed border-[#22d3ee]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-[#22d3ee] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">Drop your media here</span>
              <span className="text-sm text-white/40">Images, videos, or audio files</span>
            </div>
          </div>
        </div>
      )}

      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-40 gap-4">
          <div className="flex-shrink-0 flex items-center gap-2">
            <BrandLogo size="sm" />
          </div>

          <div className="flex-1 min-w-0 mx-4 sm:mx-6 relative overflow-hidden h-full flex items-center justify-start lg:justify-center">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
            <nav className="flex items-center gap-4 overflow-x-auto scrollbar-none w-full lg:w-auto h-full px-4 lg:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative text-[13px] font-medium transition-all duration-300 whitespace-nowrap px-1 flex-shrink-0 flex items-center h-full ${
                    activeTab === tab.id ? 'text-[#22d3ee]' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22d3ee] to-[#a855f7] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  )}
                </button>
              ))}
            </nav>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
          </div>

          <div className="flex-shrink-0 flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white/80">Fal proxy</span>
          </div>
        </header>
      )}

      <div className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'image' && <ImageStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'video' && <VideoStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'clipping' && <ClippingStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'vibe-motion' && <VibeMotionStudio apiKey={API_CONTEXT} />}
        {activeTab === 'lipsync' && <LipSyncStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'cinema' && <CinemaStudio apiKey={API_CONTEXT} />}
        {activeTab === 'audio' && <AudioStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'marketing' && <MarketingStudio apiKey={API_CONTEXT} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'workflows' && <WorkflowStudio apiKey={API_CONTEXT} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'agents' && <AgentStudio apiKey={API_CONTEXT} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'design-agent' && <DesignAgentStudio apiKey={API_CONTEXT} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'apps' && <AppsStudio apiKey={API_CONTEXT} />}
      </div>
    </div>
  );
}
