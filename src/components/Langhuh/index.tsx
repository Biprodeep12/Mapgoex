import { X } from "lucide-react";

interface huhProp {
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

const Langhuh = ({ setLangTheme }: huhProp) => {
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

  return (
    <div className='fixed inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-[2px]'>
        <div className="max-w-[320px] w-full bg-white shadow-2xl rounded-2xl p-4">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
                <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🌐 Select Language
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
