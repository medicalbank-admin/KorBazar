import { createContext, useContext, useState, useEffect } from 'react';

type HistoryContextType = {
  history: any[];
  addToHistory: (product: any) => void;
};

const HistoryContext = createContext<HistoryContextType>({} as HistoryContextType);

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('korbazar-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('korbazar-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (product: any) => {
    setHistory((prev) => {
      // Remove if already exists to push it to the front
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front and keep only latest 10
      return [product, ...filtered].slice(0, 10);
    });
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);
