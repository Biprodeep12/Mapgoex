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

interface props {
  setLangTheme: React.Dispatch<React.SetStateAction<boolean>>
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>
  setOpenDropUser: React.Dispatch<React.SetStateAction<boolean>>
}

interface propsAuth {
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const Dropdown = ({setLangTheme,setAuthOpen,setOpenDropUser}:props) => {
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpenDropUser(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return(
    <div className='absolute right-2 -bottom-[90px] bg-white flex flex-col items-center p-1 text-xl gap-1 text-nowrap rounded-xl'>
      <button onClick={()=>setLangTheme(true)} className='hover:bg-gray-100 cursor-pointer rounded-lg p-1'>Language</button>
      {!user?
        <button className='hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full' onClick={()=>setAuthOpen(true)}>Login</button> 
        :
        <button className='hover:bg-gray-100 cursor-pointer rounded-lg p-1 w-full' onClick={handleLogout}>Logout</button>
      }
    </div>
  )
}

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
    <div className='fixed inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-[2px]'>
      <div ref={dropdownRef} className='shadow-xl flex flex-col bg-white px-5 py-7 border transition-all duration-300 border-[#ccc] rounded-2xl items-center max-w-[400px] w-full'>
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