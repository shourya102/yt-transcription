import {AnimatePresence, motion} from "framer-motion";
import Header from "../../components/Header/Header.tsx";
import "./Combined.css";
import React, {useEffect, useState} from "react";
import {BiArrowBack} from "react-icons/bi";
import Results from "../Results/Results.tsx";
import Footer from "../../components/Footer/Footer.tsx";

const Combined = () => {
    const [languageSelected, setLanguageSelected] = useState<string>("");
    const [contentTypeSelected, setContentTypeSelected] = useState<string>("");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLanguage = (e: React.MouseEvent<HTMLButtonElement>) => {
        setLanguageSelected(e.currentTarget.innerText);
    };

    const handleContentType = (e: React.MouseEvent<HTMLButtonElement>) => {
        setContentTypeSelected(e.currentTarget.innerText);
    };

    return (
        <div className="custom-gradient flex flex-col min-h-screen overflow-hidden">
            <Header/>
            <AnimatePresence mode="wait">
                {!languageSelected && (
                    <motion.div
                        key="language"
                        initial={{opacity: 0, y: -50}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 50}}
                        className="flex flex-col items-center justify-center flex-1 gap-5 px-4 text-center"
                    >
                        <div className="flex flex-col gap-2">
                            <h1 className="text-neutral-300 font-semibold text-2xl">
                                Choose a language
                            </h1>
                            <h2 className="text-neutral-400 text-xl">
                                Select a language to get the transcript and summary
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 rounded-full overflow-clip w-full max-w-xl">
                            <button
                                onClick={handleLanguage}
                                className="p-8 md:p-20 flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold transition-colors"
                            >
                                English
                            </button>
                            <button
                                onClick={handleLanguage}
                                disabled={!user}
                                className="p-8 md:p-20 flex justify-center items-center bg-green-500 hover:bg-green-600 disabled:bg-neutral-600 text-white text-2xl font-bold transition-colors"
                            >
                                Hindi
                            </button>
                            <button
                                onClick={handleLanguage}
                                disabled={!user}
                                className="p-8 md:p-20 flex justify-center items-center bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-600 text-white text-2xl font-bold transition-colors"
                            >
                                Marathi
                            </button>
                        </div>
                    </motion.div>
                )}
                {languageSelected && !contentTypeSelected && (
                    <motion.div
                        key="contentType"
                        initial={{opacity: 0, y: -50}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 50}}
                        className="flex flex-col items-center justify-center flex-1 gap-5 px-4 text-center"
                    >
                        <div className="flex flex-col gap-2">
                            <h1 className="text-neutral-300 font-semibold text-2xl">
                                Choose the type of summary
                            </h1>
                            <h2 className="text-neutral-400 text-xl">
                                Select from either extractive or abstractive
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 overflow-clip rounded-full sm:grid-cols-2 w-full max-w-xl">
                            <button
                                onClick={handleContentType}
                                className="p-8 md:p-20 flex justify-center items-center bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold transition-colors"
                            >
                                Abstractive
                            </button>
                            <button
                                onClick={handleContentType}
                                className="p-8 md:p-20 flex justify-center items-center bg-red-500 hover:bg-red-600 text-white text-2xl font-bold transition-colors"
                            >
                                Extractive
                            </button>
                        </div>
                        <button
                            onClick={() => setLanguageSelected("")}
                            className="mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-800 transition-colors rounded-full font-semibold text-white flex items-center gap-2"
                        >
                            <BiArrowBack/> Back
                        </button>
                    </motion.div>
                )}
                {languageSelected && contentTypeSelected && (
                    <Results
                        language={languageSelected}
                        contentType={contentTypeSelected.concat(" Summary")}
                    />
                )}
            </AnimatePresence>
            {localStorage.getItem("user") && <Footer/>}
        </div>
    );
};

export default Combined;
