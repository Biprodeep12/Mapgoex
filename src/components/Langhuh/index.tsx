import { Languages, X } from "lucide-react";
import { useEffect, useRef } from "react";
interface huhProp {
  langTheme: boolean
  setLangTheme: React.Dispatch<React.SetStateAction<boolean>>;
}

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "gu", name: "Gujarati" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "mr", name: "Marathi" },
  { code: "or", name: "Odia" },
];

const Langhuh = ({ langTheme,setLangTheme }: huhProp) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

    function changeLanguage(lang: string) {
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event("change"));
        }
        if(lang === "en"){
            window.location.reload();
        }
        localStorage.setItem('lang',lang);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setLangTheme(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

  return (
    <div className={`fixed inset-0 z-20 ${langTheme?'flex':'hidden'} items-center justify-center bg-white/20 backdrop-blur-[2px]`}>
        <div ref={dropdownRef} className="max-w-[320px] w-full bg-white shadow-2xl rounded-2xl p-4">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
                <div className="text-lg font-semibold text-gray-800 flex flex-row items-center gap-2">
                    <Languages className='text-blue-600 w-5 h-5'/> 
                    Select Language
                </div>
                <button
                    onClick={() => setLangTheme(false)}
                    className="p-1 cursor-pointer rounded-full hover:bg-gray-200 transition"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
                {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full cursor-pointer text-left px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                >
                    {lang.name}
                </button>
                ))}
            </div>

            <div id="google_translate_element" className="hidden" />
        </div>
    </div>
  );
};

export default Langhuh;
