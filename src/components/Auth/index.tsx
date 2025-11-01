import { useEffect, useRef, useState } from 'react';
import { auth } from '@/firebase/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useAuth } from '@/context/userContext';
import {Languages, LogIn, LogOut, TicketCheck} from 'lucide-react';

interface props {
  setLangTheme: React.Dispatch<React.SetStateAction<boolean>>
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>
  setOpenDropUser: React.Dispatch<React.SetStateAction<boolean>>
}

interface propsAuth {
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const Dropdown = ({setLangTheme,setAuthOpen,setOpenDropUser}:props) => {
  const { user, setTicketHistory, fetchTickets, books } = useAuth();
  const mobileRef = useRef<HTMLDivElement>(null)
  const desktopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileRef.current &&
        !mobileRef.current.contains(event.target as Node) &&
        desktopRef.current &&
        !desktopRef.current.contains(event.target as Node)
      ) {
        setOpenDropUser(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenDropUser]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const TicketHistoryCheck = () =>{
    if(!user?.uid){
      setAuthOpen(true)
      return;
    }
    setTicketHistory(true)
    
    if(books.length == 0){
      fetchTickets();
    }
  }

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bg-white z-10 drop-shadow-2xl rounded-lg text-lg backdrop-blur-2xl hidden max-[500px]:flex flex-col p-4 gap-3"
      >
        <button
          onClick={() => setLangTheme(true)}
          className="bg-gray-50 cursor-pointer rounded-lg h-11 p-1 flex flex-row gap-2 items-center"
        >
          <Languages className="text-blue-600 w-5 h-5" />
          Language
        </button>
        <button onClick={TicketHistoryCheck} className="bg-gray-50 cursor-pointer rounded-lg h-11 p-2 w-full flex flex-row gap-2 items-center">
          <TicketCheck className="text-green-400 w-5 h-5" />
          Ticket
        </button>
        {!user ? (
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-gray-50 cursor-pointer rounded-lg h-11 p-2 w-full flex flex-row gap-2 items-center"
          >
            <LogIn className="text-blue-600 w-5 h-5" />
            Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-blue-50/50 cursor-pointer rounded-lg h-11 p-2 w-full flex flex-row gap-2 items-center"
          >
            <LogOut className="text-red-500 w-5 h-5" />
            Logout
          </button>
        )}
      </div>

      <div
        className="absolute z-10 right-2 -bottom-[140px] w-[180px] bg-white flex max-[500px]:hidden drop-shadow-2xl flex-col items-center p-2 text-xl gap-1 text-nowrap rounded-xl"
      >
        <button
          onClick={() => setLangTheme(true)}
          className="bg-white hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full flex flex-row gap-1 items-center"
        >
          <Languages className="text-blue-600 w-5 h-5" />
          Language
        </button>
        <button onClick={TicketHistoryCheck} className="bg-white hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full flex flex-row gap-1 items-center">
          <TicketCheck className="text-green-400 w-5 h-5" />
          Ticket
        </button>
        {!user ? (
          <button
            onClick={() => setAuthOpen(true)}
            className="hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full flex flex-row gap-1 items-center"
          >
            <LogIn className="text-blue-600 w-5 h-5" />
            Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full flex flex-row gap-1 items-center"
          >
            <LogOut className="text-red-500 w-5 h-5" />
            Logout
          </button>
        )}
      </div>
    </>
  );
};

const AuthPage = ({setAuthOpen}:propsAuth) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setAuthOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      window.location.href = '/';
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = '/';
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Google Sign-In failed. Try again.');
      }
    }
  };

  return (
    <div className='fixed inset-0 z-[1000] flex items-center justify-center bg-white/20 backdrop-blur-[2px]'>
      <div ref={dropdownRef} className='shadow-xl flex flex-col bg-white px-5 py-7 border transition-all duration-300 border-[#ccc] rounded-2xl items-center max-w-[400px] w-[95%]'>
        <div className='text-3xl mb-4 font-bold'>
          {isRegister ? 'Register' : 'Login'}
        </div>
        {error && <p className='text-red-500'>{error}</p>}

        <form onSubmit={handleSubmit} className='flex flex-col gap-3 w-full'>
          {isRegister && (
            <input
              type='text'
              placeholder='Name'
              className='border-b border-[#ccc] h-10 outline-none'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type='email'
            placeholder='Email'
            className='border-b border-[#ccc] h-10 outline-none'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type='password'
            placeholder='Password'
            className='border-b border-[#ccc] h-10 outline-none'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type='submit'
            className='bg-blue-500 rounded-xl font-bold text-white px-4 py-2'>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          className='bg-gray-200 rounded-xl font-bold px-4 py-2 mt-4'>
          Sign in with Google
        </button>

        <div className='mt-4'>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className='text-blue-500'>
            {isRegister ? 'Login here' : 'Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;