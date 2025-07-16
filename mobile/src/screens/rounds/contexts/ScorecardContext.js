import React, { createContext, useContext } from 'react';

const ScorecardContext = createContext();

export const useScorecardContext = () => {
  const context = useContext(ScorecardContext);
  if (!context) {
    throw new Error('useScorecardContext must be used within ScorecardProvider');
  }
  return context;
};

export const ScorecardProvider = ({ children, value }) => {
  return (
    <ScorecardContext.Provider value={value}>
      {children}
    </ScorecardContext.Provider>
  );
};