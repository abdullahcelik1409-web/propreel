"use client";

import { useState, useEffect } from 'react';
import { CreativeCanvas } from 'design-agent';

export default function DesignAgentStudio({ apiKey, isHeaderVisible, onToggleHeader }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("fromDesignAgent", "true");
    if (!apiKey) return;
    localStorage.setItem("token", apiKey);
    setUserData({
      username: 'Studio User',
      email: null,
      balance: 0
    });
  }, [apiKey]);

  return (
    <div className="h-full w-full bg-black overflow-hidden design-agent-studio">
      <CreativeCanvas 
        user={userData}
        isAuthorized={!!userData}
        creditConversionRate={200}
        theme="dark"
        onToggleHeader={onToggleHeader}
        isHeaderVisible={isHeaderVisible}
      />
    </div>
  );
}
