import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ITicketItem } from '@/models/ticketInfo';

interface AuthContextType {
  user: User | null;
  liveTickets: boolean;
  setLiveTickets: React.Dispatch<React.SetStateAction<boolean>>;
  ticketHistory: boolean;
  setTicketHistory: React.Dispatch<React.SetStateAction<boolean>>;
  books: ITicketItem[];
  setBooks: React.Dispatch<React.SetStateAction<ITicketItem[]>>;
  fetchTickets: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [liveTickets, setLiveTickets] = useState(false)
  const [ticketHistory, setTicketHistory] = useState(false);
  const [books, setBooks] = useState<ITicketItem[]>([]);

  const fetchTickets = async() => {
    setLiveTickets(true);
    try {
      const res = await fetch(`/api/book/${user?.uid}`);
      const data = await res.json();
      setBooks(data.reverse())
    } catch {
      setBooks([])
    } finally {
      setLiveTickets(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        liveTickets, 
        setLiveTickets,
        ticketHistory, 
        setTicketHistory,
        books, 
        setBooks,
        fetchTickets 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};