import {BsFileCodeFill, BsFilePdfFill, BsFileWordFill} from "react-icons/bs";
import {IoIosCopy} from "react-icons/io";
import React, {useEffect, useMemo, useState} from "react";
import jsPDF from "jspdf";
import {Document, Packer, Paragraph, TextRun} from "docx";
import {fontbase64} from "./fontbase64.ts";
import {toast, ToastContainer} from "react-toastify";
import {AnimatePresence, motion} from "framer-motion";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./Results.css";
import {useParams} from "react-router-dom";

interface ResultsProps {
    language: string;
    contentType: string;
}

interface Text {
    transcript: string;
    extractive: string;
    abstractive: string;
}

interface Summaries {
    en: Text;
    hi: Text;
    mr: Text;
}

const Results: React.FC<ResultsProps> = ({language, contentType}) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>(language || "English");
    const [selectedContentType, setSelectedContentType] = useState<string>(contentType || "Transcript");
    const [content, setContent] = useState<string>("");
    const languages: string[] = ["English", "Hindi", "Marathi"];
    const contentTypes: string[] = ["Transcript", "Extractive Summary", "Abstractive Summary"];
    const [user, setUser] = useState<any>(null);
    const params = useParams();
    const data = useMemo(() => {
        const searchValue: string = params.youtube_url as string;
        return JSON.parse(localStorage.getItem(searchValue) as string || "{}") as Summaries;
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const getContent = (lang: Text) => {
            switch (selectedContentType) {
                case "Transcript":
                    return lang.transcript;
                case "Extractive Summary":
                    return lang.extractive;
                case "Abstractive Summary":
                    return lang.abstractive;
                default:
                    return "No Content Available";
            }
        };
        if (data) {
            const langContent = {
                English: data.en,
                Hindi: data.hi,
                Marathi: data.mr,
            }[selectedLanguage];
            setContent(langContent ? getContent(langContent) : "No Content Available");
        }
    }, [data, selectedContentType, selectedLanguage]);

    const handleExportPDF = () => {
        if (!content) return;
        const doc = new jsPDF();
        doc.addFileToVFS("NotoSansDevanagari.ttf", fontbase64);
        doc.addFont("NotoSansDevanagari.ttf", "NotoSansDevanagari", "normal");
        doc.setFont("NotoSansDevanagari");
        doc.setFontSize(12);
        const textOptions = {lang: "hi", font: "NotoSansDevanagari", encoding: "Identity-H"};
        const lines = doc.splitTextToSize(content, 180);
        // @ts-ignore
        doc.text(lines, 10, 10, textOptions);
        doc.save(`${selectedLanguage}_${selectedContentType}.pdf`);
        handleDownloadReport(`${selectedLanguage}_${selectedContentType}.pdf`);
    };

    const handleExportWord = () => {
        if (!content) return;
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [new Paragraph({children: [new TextRun(content)]})],
                },
            ],
        });
        Packer.toBlob(doc).then((blob) => downloadBlob(blob, "docx"));
        handleDownloadReport(`${selectedLanguage}_${selectedContentType}.docx`);
    };

    const handleExportHTML = () => {
        if (!content) return;
        const blob = new Blob([content], {type: "text/html"});
        downloadBlob(blob, "html");
        handleDownloadReport(`${selectedLanguage}_${selectedContentType}.html`);
    };

    const handleCopyContent = async () => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            toast("Content copied to clipboard!", {
                type: "success",
                theme: "dark",
                autoClose: 3000,
                position: "top-center",
            });
        } catch (err) {
            toast(`Error: ${err}`, {
                type: "error",
                theme: "dark",
                autoClose: 3000,
                position: "top-center",
            });
        }
    };

    const downloadBlob = (blob: Blob, extension: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedLanguage}_${selectedContentType}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadReport = async (filename: string) => {
        if (localStorage.getItem("user")) {
            axios
                .post(
                    "http://localhost:5000/download",
                    {item: filename},
                    {
                        headers: {
                            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user") as string).access_token}`,
                        },
                    }
                )
                .then((res) => {
                    console.log(res.data);
                })
                .catch((e) => {
                    console.log(e);
                });
        }
    };

    const exportButtons = [
        {icon: BsFilePdfFill, action: handleExportPDF, key: "pdf"},
        {icon: BsFileWordFill, action: handleExportWord, key: "word"},
        {icon: BsFileCodeFill, action: handleExportHTML, key: "html"},
        {icon: IoIosCopy, action: handleCopyContent, key: "copy"},
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{opacity: 0, y: -50}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 50}}
                className="flex flex-col md:flex-row gap-6 p-4 md:px-8 lg:px-12 xl:px-16"
            >
                <motion.div
                    initial={{opacity: 0, x: -30}}
                    animate={{opacity: 1, x: 0}}
                    className="w-full md:w-64 lg:w-72 flex flex-col gap-6"
                >
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700"
                    >
                        <h2 className="text-neutral-300 text-xl font-semibold mb-3">Language</h2>
                        <div className="flex flex-col gap-2">
                            {languages.map((lang) => (
                                <motion.button
                                    whileHover={(!user && (lang === "Hindi" || lang === "Marathi")) ? {} : {scale: 1.02}}
                                    key={lang}
                                    disabled={!user && (lang === "Hindi" || lang === "Marathi")}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`text-left p-3 disabled:bg-transparent disabled:hover:text-neutral-300 rounded-lg transition-all ${
                                        selectedLanguage === lang
                                            ? "bg-blue-600/80 text-white"
                                            : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700"
                                    }`}
                                >
                                    {lang}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700"
                    >
                        <h2 className="text-neutral-300 text-xl font-semibold mb-3">Content Type</h2>
                        <div className="flex flex-col gap-2">
                            {contentTypes.map((type) => (
                                <motion.button
                                    whileHover={{scale: 1.02}}
                                    key={type}
                                    onClick={() => setSelectedContentType(type)}
                                    className={`text-left p-3 rounded-lg transition-all ${
                                        selectedContentType === type
                                            ? "bg-orange-600/80 text-white"
                                            : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700"
                                    }`}
                                >
                                    {type}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
                <motion.div
                    initial={{opacity: 0, x: 30}}
                    animate={{opacity: 1, x: 0}}
                    className="flex-1 flex flex-col gap-6"
                >
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-700 flex flex-col"
                    >
                        <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    {selectedContentType} in {selectedLanguage}
                                </h1>
                                <p className="text-neutral-400">Generated content based on your input</p>
                            </div>
                            <div className="flex gap-2">
                                {exportButtons.map(({icon: Icon, action, key}) => (
                                    <motion.button
                                        whileHover={(!user && (key === "copy" || key === 'word' || key === 'html')) ? {} : {scale: 1.1}}
                                        key={key}
                                        disabled={!user && (key === "copy" || key === 'word' || key === 'html')}
                                        onClick={action}
                                        className="p-2.5 rounded-lg bg-neutral-700/50 disabled:bg-neutral-800/50 hover:bg-neutral-700 transition-colors text-neutral-300 disabled:text-neutral-300 hover:text-white"
                                    >
                                        <Icon size={20}/>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        <div
                            className="overflow-y-auto custom-scrollbar min-h-[30rem] max-h-[30rem] bg-neutral-900/30 rounded-lg p-4 text-white font-mono whitespace-pre-wrap">
                            {content || "Loading content..."}
                        </div>
                    </motion.div>
                </motion.div>
                <ToastContainer
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar
                    newestOnTop
                    theme="colored"
                    toastStyle={{backgroundColor: "#3f3f46", color: "#fff"}}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default Results;
