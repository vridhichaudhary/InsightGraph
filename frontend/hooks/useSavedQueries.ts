import { useState, useEffect } from "react";

export interface SavedQuery {
  id: string;
  query: string;
  timestamp: string;
}

export function useSavedQueries() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("insightgraph_queries");
    if (saved) {
      setQueries(JSON.parse(saved));
    }
  }, []);

  const saveQuery = (query: string) => {
    setQueries((prev) => {
      // Avoid duplicate consecutive queries
      if (prev.length > 0 && prev[0].query === query) return prev;
      
      const newQuery: SavedQuery = {
        id: Math.random().toString(36).substr(2, 9),
        query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [newQuery, ...prev].slice(0, 15); // Keep last 15
      localStorage.setItem("insightgraph_queries", JSON.stringify(updated));
      return updated;
    });
  };

  const clearQueries = () => {
    setQueries([]);
    localStorage.removeItem("insightgraph_queries");
  };

  return { queries, saveQuery, clearQueries };
}
